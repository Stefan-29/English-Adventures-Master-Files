create function public.admin_save_plan(
    p_actor uuid,
    p_id text,
    p_name text,
    p_description text,
    p_price_idr bigint,
    p_duration_months smallint,
    p_active boolean
)
returns public.plans
language plpgsql
security definer
set search_path = ''
as $$
declare
    saved_plan public.plans%rowtype;
begin
    insert into public.plans (
        id,
        name,
        description,
        price_idr,
        duration_months,
        active
    )
    values (
        p_id,
        p_name,
        coalesce(p_description, ''),
        p_price_idr,
        p_duration_months,
        p_active
    )
    on conflict (id) do update
    set name = excluded.name,
        description = excluded.description,
        price_idr = excluded.price_idr,
        duration_months = excluded.duration_months,
        active = excluded.active
    returning * into saved_plan;

    insert into public.audit_log (actor, action, target, metadata)
    values (
        p_actor,
        'plan.upsert',
        p_id,
        jsonb_build_object(
            'price_idr', p_price_idr,
            'duration_months', p_duration_months,
            'active', p_active
        )
    );

    return saved_plan;
end;
$$;

create function public.admin_deactivate_plan(
    p_actor uuid,
    p_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.plans
    set active = false
    where id = p_id;

    if not found then
        raise exception 'PLAN_NOT_FOUND';
    end if;

    insert into public.audit_log (actor, action, target, metadata)
    values (p_actor, 'plan.deactivate', p_id, '{}'::jsonb);
end;
$$;

revoke all on function public.admin_save_plan(uuid, text, text, text, bigint, smallint, boolean)
    from public, anon, authenticated;
revoke all on function public.admin_deactivate_plan(uuid, text)
    from public, anon, authenticated;
grant execute on function public.admin_save_plan(uuid, text, text, text, bigint, smallint, boolean)
    to service_role;
grant execute on function public.admin_deactivate_plan(uuid, text)
    to service_role;
