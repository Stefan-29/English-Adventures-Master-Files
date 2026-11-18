create function public.admin_lookup_account(p_email text)
returns table (
    account_id uuid,
    account_email text,
    account_display_name text,
    account_role text,
    account_status text,
    account_email_verified boolean,
    access_records jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    normalized_email text := lower(trim(coalesce(p_email, '')));
begin
    if not public.is_owner() then
        raise exception 'NOT_AUTHORIZED';
    end if;

    if char_length(normalized_email) > 254
        or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then
        raise exception 'INVALID_EMAIL';
    end if;

    return query
    select
        p.id,
        u.email::text,
        p.display_name,
        p.role,
        p.status,
        u.email_confirmed_at is not null,
        coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'id', recent.id,
                    'source', recent.source,
                    'status', recent.status,
                    'granted_at', recent.granted_at,
                    'expires_at', recent.expires_at,
                    'note', recent.note
                )
                order by recent.granted_at desc
            )
            from (
                select e.id, e.source, e.status, e.granted_at, e.expires_at, e.note
                from public.enrollments e
                where e.user_id = p.id
                order by e.granted_at desc
                limit 20
            ) recent
        ), '[]'::jsonb)
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(trim(coalesce(u.email, ''))) = normalized_email
      and u.email_confirmed_at is not null;
end;
$$;

create function public.admin_grant_manual_access(
    p_user_id uuid,
    p_duration_months smallint,
    p_note text
)
returns table (enrollment_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_role text;
    target_status text;
    target_email_confirmed_at timestamptz;
    access_start timestamptz;
    access_expiry timestamptz;
    new_enrollment_id uuid;
    clean_note text := nullif(trim(coalesce(p_note, '')), '');
begin
    if not public.is_owner() then
        raise exception 'NOT_AUTHORIZED';
    end if;

    if p_duration_months is not null and p_duration_months not in (1, 3, 12) then
        raise exception 'INVALID_ACCESS_DURATION';
    end if;
    if clean_note is null or char_length(clean_note) > 500 then
        raise exception 'ACCESS_NOTE_REQUIRED';
    end if;

    select p.role, p.status, u.email_confirmed_at
    into target_role, target_status, target_email_confirmed_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = p_user_id
    for update of p;

    if not found or target_status <> 'active' or target_email_confirmed_at is null then
        raise exception 'VERIFIED_ACTIVE_ACCOUNT_REQUIRED';
    end if;
    if target_role = 'owner' then
        raise exception 'OWNER_ACCESS_NOT_GRANTABLE';
    end if;

    if exists (
        select 1
        from public.enrollments e
        where e.user_id = p_user_id
          and e.status = 'active'
          and e.expires_at is null
    ) then
        raise exception 'ACTIVE_LIFETIME_ACCESS';
    end if;

    if p_duration_months is null then
        access_expiry := null;
    else
        select greatest(coalesce(max(e.expires_at), now()), now())
        into access_start
        from public.enrollments e
        where e.user_id = p_user_id
          and e.status = 'active'
          and e.expires_at > now();
        access_expiry := access_start + make_interval(months => p_duration_months::integer);
    end if;

    insert into public.enrollments (
        user_id,
        plan,
        source,
        status,
        granted_at,
        expires_at,
        note,
        granted_by
    )
    values (
        p_user_id,
        'full_access',
        'manual',
        'active',
        now(),
        access_expiry,
        clean_note,
        auth.uid()
    )
    returning id into new_enrollment_id;

    insert into public.audit_log (actor, action, target, metadata)
    values (
        auth.uid(),
        'access.manual_grant',
        p_user_id::text,
        jsonb_build_object(
            'duration_months', p_duration_months,
            'expires_at', access_expiry,
            'note', clean_note
        )
    );

    return query select new_enrollment_id, access_expiry;
end;
$$;

create function public.admin_revoke_manual_access(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_user_id uuid;
begin
    if not public.is_owner() then
        raise exception 'NOT_AUTHORIZED';
    end if;

    update public.enrollments
    set status = 'revoked'
    where id = p_enrollment_id
      and source = 'manual'
      and status = 'active'
    returning user_id into target_user_id;

    if not found then
        raise exception 'ACTIVE_MANUAL_ACCESS_NOT_FOUND';
    end if;

    insert into public.audit_log (actor, action, target, metadata)
    values (
        auth.uid(),
        'access.manual_revoke',
        target_user_id::text,
        jsonb_build_object('enrollment_id', p_enrollment_id)
    );
end;
$$;

revoke all on function public.admin_lookup_account(text) from public, anon, authenticated;
revoke all on function public.admin_grant_manual_access(uuid, smallint, text) from public, anon, authenticated;
revoke all on function public.admin_revoke_manual_access(uuid) from public, anon, authenticated;
grant execute on function public.admin_lookup_account(text) to authenticated;
grant execute on function public.admin_grant_manual_access(uuid, smallint, text) to authenticated;
grant execute on function public.admin_revoke_manual_access(uuid) to authenticated;

comment on function public.admin_lookup_account(text) is
    'Owner-only exact-email lookup for a verified learner and their recent access records.';
comment on function public.admin_grant_manual_access(uuid, smallint, text) is
    'Owner-only audited full-access grant; fixed-duration access begins after any active expiring entitlement.';
comment on function public.admin_revoke_manual_access(uuid) is
    'Owner-only audited revocation of a manual entitlement; payment and trial records cannot be revoked here.';
