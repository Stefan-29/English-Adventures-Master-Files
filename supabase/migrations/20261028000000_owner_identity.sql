-- The configured owner identity is assigned by trusted auth metadata only.
-- Client-provided signup metadata cannot set profile roles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    user_is_minor boolean := coalesce(new.raw_user_meta_data ->> 'is_minor', 'false') = 'true';
    user_guardian_email text := nullif(lower(trim(new.raw_user_meta_data ->> 'guardian_email')), '');
    guardian_consent boolean := coalesce(new.raw_user_meta_data ->> 'guardian_consent', 'false') = 'true';
    is_configured_owner boolean := lower(trim(coalesce(new.email, ''))) = 'stefanustankaemingk2@gmail.com';
begin
    if user_is_minor and (
        user_guardian_email is null
        or not guardian_consent
        or char_length(user_guardian_email) > 254
        or position('@' in user_guardian_email) <= 1
    ) then
        raise exception 'Guardian email and consent are required for minor accounts';
    end if;

    insert into public.profiles (
        id,
        display_name,
        role,
        is_minor,
        guardian_email,
        guardian_consent_at
    )
    values (
        new.id,
        nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 100), ''),
        case when is_configured_owner then 'owner' else 'free' end,
        user_is_minor,
        case when user_is_minor then user_guardian_email else null end,
        case when user_is_minor then now() else null end
    );
    return new;
end;
$$;

-- Promote the already-registered configured account as well. Authentication
-- still requires verified email and aal2 through public.is_owner().
update public.profiles p
set role = 'owner'
from auth.users u
where u.id = p.id
  and lower(trim(coalesce(u.email, ''))) = 'stefanustankaemingk2@gmail.com';

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select (select auth.jwt()) ->> 'aal' = 'aal2'
       and exists (
           select 1
           from public.profiles p
           join auth.users u on u.id = p.id
           where p.id = (select auth.uid())
             and p.role = 'owner'
             and p.status = 'active'
             and u.email_confirmed_at is not null
             and lower(trim(coalesce(u.email, ''))) = 'stefanustankaemingk2@gmail.com'
       );
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
revoke all on function public.is_owner() from public, anon, authenticated;
grant execute on function public.is_owner() to authenticated;
