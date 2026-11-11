alter table public.enrollments
    add column payment_order_id uuid
        references public.orders (id) on delete restrict;

create unique index enrollments_payment_order_unique
    on public.enrollments (payment_order_id)
    where payment_order_id is not null;

create or replace function public.process_midtrans_notification(
    p_midtrans_order_id text,
    p_gross_amount_idr numeric,
    p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    order_row public.orders%rowtype;
    plan_duration smallint;
    current_status text;
    enrollment_expiry timestamptz;
begin
    if p_status not in ('pending', 'paid', 'failed', 'cancelled', 'refunded') then
        raise exception 'INVALID_PAYMENT_STATUS';
    end if;

    select o.*
    into order_row
    from public.orders o
    where o.midtrans_order_id = p_midtrans_order_id
    for update;

    if not found then
        raise exception 'ORDER_NOT_FOUND';
    end if;

    if p_gross_amount_idr <> order_row.gross_amount_idr then
        raise exception 'AMOUNT_MISMATCH';
    end if;

    current_status := order_row.status;

    if current_status = 'refunded' then
        return current_status;
    end if;

    if current_status = 'paid' and p_status not in ('paid', 'refunded') then
        return current_status;
    end if;

    if p_status = 'refunded' and current_status <> 'paid' then
        raise exception 'REFUND_BEFORE_SETTLEMENT';
    end if;

    insert into public.payments (
        order_id,
        midtrans_order_id,
        gross_amount_idr,
        status,
        raw_signature_ok,
        paid_at
    )
    values (
        order_row.id,
        order_row.midtrans_order_id,
        order_row.gross_amount_idr,
        p_status,
        true,
        case when p_status = 'paid' then now() else null end
    )
    on conflict (midtrans_order_id) do update
    set status = excluded.status,
        raw_signature_ok = true,
        paid_at = case
            when excluded.status = 'paid' then coalesce(payments.paid_at, now())
            else payments.paid_at
        end;

    update public.orders
    set status = p_status
    where id = order_row.id;

    if p_status = 'paid' then
        select p.duration_months
        into plan_duration
        from public.plans p
        where p.id = order_row.plan_id;

        if not found then
            raise exception 'PLAN_NOT_FOUND';
        end if;

        if plan_duration is null then
            enrollment_expiry := null;
        else
            select greatest(coalesce(max(e.expires_at), now()), now())
            into enrollment_expiry
            from public.enrollments e
            where e.user_id = order_row.user_id
              and e.status = 'active'
              and e.expires_at is not null;

            enrollment_expiry := enrollment_expiry + make_interval(months => plan_duration);
        end if;

        insert into public.enrollments (
            user_id,
            plan,
            source,
            status,
            granted_at,
            expires_at,
            note,
            payment_order_id
        )
        values (
            order_row.user_id,
            'full_access',
            'payment',
            'active',
            now(),
            enrollment_expiry,
            'Verified Midtrans payment',
            order_row.id
        )
        on conflict (payment_order_id) where payment_order_id is not null
        do nothing;
    elsif p_status = 'refunded' then
        update public.enrollments
        set status = 'revoked'
        where payment_order_id = order_row.id
          and status = 'active';
    end if;

    return p_status;
end;
$$;

revoke all on function public.process_midtrans_notification(text, numeric, text)
    from public, anon, authenticated;
grant execute on function public.process_midtrans_notification(text, numeric, text)
    to service_role;
