alter table public.plans
    add column if not exists trial_days smallint;

alter table public.plans
    drop constraint if exists plans_trial_days_check;
alter table public.plans
    add constraint plans_trial_days_check
        check (trial_days is null or trial_days between 1 and 30);

alter table public.enrollments
    add column if not exists trial_plan_id text
        references public.plans (id) on delete restrict;

alter table public.enrollments
    drop constraint if exists enrollments_source_check;
alter table public.enrollments
    add constraint enrollments_source_check
        check (source in ('manual', 'payment', 'trial'));

alter table public.enrollments
    drop constraint if exists enrollments_trial_plan_check;
alter table public.enrollments
    add constraint enrollments_trial_plan_check
        check (
            (source = 'trial' and trial_plan_id is not null)
            or source <> 'trial'
        );

create unique index if not exists enrollments_one_trial_per_user
    on public.enrollments (user_id)
    where source = 'trial';

create or replace function public.start_user_trial(
    p_user_id uuid,
    p_plan_id text
)
returns table (enrollment_id uuid, expires_at timestamptz, trial_days smallint)
language plpgsql
security definer
set search_path = ''
as $$
declare
    account_role text;
    account_status text;
    account_email_confirmed_at timestamptz;
    configured_trial_days smallint;
    trial_enrollment_id uuid;
    trial_expires_at timestamptz;
    trial_granted_at timestamptz;
begin
    select p.role, p.status, u.email_confirmed_at
    into account_role, account_status, account_email_confirmed_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = p_user_id
    for update of p;

    if not found
        or account_status <> 'active'
        or account_email_confirmed_at is null
        or account_role = 'owner'
    then
        raise exception 'TRIAL_ACCOUNT_NOT_ELIGIBLE';
    end if;

    select p.trial_days
    into configured_trial_days
    from public.plans p
    where p.id = p_plan_id
      and p.active
      and p.trial_days is not null;

    if not found then
        raise exception 'TRIAL_PLAN_UNAVAILABLE';
    end if;

    if exists (
        select 1
        from public.enrollments e
        where e.user_id = p_user_id
    ) then
        raise exception 'TRIAL_NOT_ELIGIBLE';
    end if;

    trial_granted_at := now();
    trial_expires_at := trial_granted_at + make_interval(days => configured_trial_days);

    insert into public.enrollments (
        user_id,
        plan,
        source,
        status,
        granted_at,
        expires_at,
        note,
        trial_plan_id
    )
    values (
        p_user_id,
        'full_access',
        'trial',
        'active',
        trial_granted_at,
        trial_expires_at,
        'Free trial for plan ' || p_plan_id,
        p_plan_id
    )
    returning id into trial_enrollment_id;

    return query
    select trial_enrollment_id, trial_expires_at, configured_trial_days;
end;
$$;

revoke all on function public.start_user_trial(uuid, text)
    from public, anon, authenticated;
grant execute on function public.start_user_trial(uuid, text)
    to service_role;

comment on column public.plans.trial_days is
    'Optional free-trial duration in days; null disables the offer.';
comment on column public.enrollments.trial_plan_id is
    'Plan that configured the trial duration; retained if payment processing converts the enrollment source.';
