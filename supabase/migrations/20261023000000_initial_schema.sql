-- Initial private-content platform schema for Supabase.

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text check (display_name is null or char_length(display_name) <= 100),
    role text not null default 'free'
        check (role in ('owner', 'student', 'free')),
    status text not null default 'active'
        check (status in ('active', 'suspended')),
    is_minor boolean not null default false,
    guardian_email text,
    guardian_consent_at timestamptz,
    created_at timestamptz not null default now(),
    constraint profiles_guardian_consent_check check (
        (is_minor and guardian_email is not null and guardian_consent_at is not null)
        or
        (not is_minor and guardian_email is null and guardian_consent_at is null)
    ),
    constraint profiles_guardian_email_check check (
        guardian_email is null
        or (
            char_length(guardian_email) <= 254
            and position('@' in guardian_email) > 1
        )
    )
);

create table public.topics (
    id text primary key
        check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
    title text not null check (char_length(title) between 1 and 200),
    description text not null default '' check (char_length(description) <= 1000),
    tense_group text not null default 'other' check (char_length(tense_group) <= 100),
    is_free boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.plans (
    id text primary key
        check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
    name text not null check (char_length(name) between 1 and 120),
    description text not null default '' check (char_length(description) <= 500),
    price_idr bigint not null check (price_idr > 0),
    duration_months smallint
        check (duration_months is null or duration_months in (1, 3, 12)),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.enrollments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    plan text not null default 'full_access' check (plan = 'full_access'),
    source text not null check (source in ('manual', 'payment')),
    status text not null default 'active'
        check (status in ('active', 'revoked', 'expired')),
    granted_at timestamptz not null default now(),
    expires_at timestamptz,
    note text check (note is null or char_length(note) <= 2000),
    granted_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    constraint enrollments_expiry_check check (
        expires_at is null or expires_at > granted_at
    )
);

create index enrollments_active_user_idx
    on public.enrollments (user_id, expires_at)
    where status = 'active';

create table public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    plan_id text not null references public.plans (id) on delete restrict,
    midtrans_order_id text not null unique,
    gross_amount_idr bigint not null check (gross_amount_idr > 0),
    status text not null default 'pending'
        check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint orders_payment_identity_unique
        unique (id, midtrans_order_id, gross_amount_idr)
);

create index orders_user_created_idx
    on public.orders (user_id, created_at desc);

create table public.payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null,
    midtrans_order_id text not null unique,
    gross_amount_idr bigint not null check (gross_amount_idr > 0),
    status text not null
        check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    raw_signature_ok boolean not null default false,
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    constraint payments_order_identity_fk
        foreign key (order_id, midtrans_order_id, gross_amount_idr)
        references public.orders (id, midtrans_order_id, gross_amount_idr)
        on delete restrict
);

create index payments_created_idx on public.payments (created_at desc);

create table public.progress (
    user_id uuid not null references public.profiles (id) on delete cascade,
    topic_id text not null references public.topics (id) on delete cascade,
    state jsonb not null default '{}'::jsonb
        check (jsonb_typeof(state) = 'object'),
    stars integer not null default 0 check (stars >= 0),
    updated_at timestamptz not null default now(),
    primary key (user_id, topic_id)
);

create index progress_topic_updated_idx on public.progress (topic_id, updated_at desc);

create table public.audit_log (
    id bigint generated always as identity primary key,
    actor uuid references public.profiles (id) on delete set null,
    action text not null check (char_length(action) between 1 and 120),
    target text check (target is null or char_length(target) <= 300),
    metadata jsonb not null default '{}'::jsonb
        check (jsonb_typeof(metadata) = 'object'),
    ip inet,
    created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

create table public.student_groups (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 160),
    note text check (note is null or char_length(note) <= 2000),
    created_at timestamptz not null default now()
);

create table public.group_members (
    group_id uuid not null references public.student_groups (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id, group_id);

-- Signup metadata cannot assign roles. Minor accounts require an explicit
-- guardian contact and consent attestation before a profile can be created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    user_is_minor boolean := coalesce(new.raw_user_meta_data ->> 'is_minor', 'false') = 'true';
    user_guardian_email text := nullif(lower(trim(new.raw_user_meta_data ->> 'guardian_email')), '');
    guardian_consent boolean := coalesce(new.raw_user_meta_data ->> 'guardian_consent', 'false') = 'true';
begin
    if user_is_minor and (
        user_guardian_email is null
        or not guardian_consent
        or char_length(user_guardian_email) > 254
        or position('@' in user_guardian_email) <= 1
    ) then
        raise exception 'Guardian email and consent are required for minor accounts';
    end if;

    insert into public.profiles (id, display_name, is_minor, guardian_email, guardian_consent_at)
    values (
        new.id,
        nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 100), ''),
        user_is_minor,
        case when user_is_minor then user_guardian_email else null end,
        case when user_is_minor then now() else null end
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger topics_set_updated_at
    before update on public.topics
    for each row execute function public.set_updated_at();

create trigger plans_set_updated_at
    before update on public.plans
    for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
    before update on public.orders
    for each row execute function public.set_updated_at();

create trigger progress_set_updated_at
    before update on public.progress
    for each row execute function public.set_updated_at();

-- These helpers bypass profile RLS only for their fixed, read-only checks.
create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles p
        join auth.users u on u.id = p.id
        where p.id = (select auth.uid())
          and p.status = 'active'
          and u.email_confirmed_at is not null
    );
$$;

create function public.is_owner()
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
       );
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_active_user() from public, anon, authenticated;
revoke all on function public.is_owner() from public, anon, authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_owner() to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.topics enable row level security;
alter table public.topics force row level security;
alter table public.plans enable row level security;
alter table public.plans force row level security;
alter table public.enrollments enable row level security;
alter table public.enrollments force row level security;
alter table public.orders enable row level security;
alter table public.orders force row level security;
alter table public.payments enable row level security;
alter table public.payments force row level security;
alter table public.progress enable row level security;
alter table public.progress force row level security;
alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;
alter table public.student_groups enable row level security;
alter table public.student_groups force row level security;
alter table public.group_members enable row level security;
alter table public.group_members force row level security;

create policy profiles_read_self on public.profiles
    for select to authenticated
    using (id = (select auth.uid()) or (select public.is_owner()));

create policy topics_read_public_index on public.topics
    for select to anon, authenticated
    using (true);

create policy topics_owner_read on public.topics
    for select to authenticated
    using ((select public.is_owner()));

create policy plans_read_active on public.plans
    for select to anon, authenticated
    using (active);

create policy plans_owner_read on public.plans
    for select to authenticated
    using ((select public.is_owner()));

create policy enrollments_owner_read on public.enrollments
    for select to authenticated
    using ((select public.is_owner()));

create policy orders_read_own on public.orders
    for select to authenticated
    using (user_id = (select auth.uid()) or (select public.is_owner()));

create policy payments_read_own on public.payments
    for select to authenticated
    using (
        (select public.is_owner())
        or exists (
            select 1
            from public.orders o
            where o.id = payments.order_id
              and o.user_id = (select auth.uid())
        )
    );

create policy progress_read_own on public.progress
    for select to authenticated
    using (
        (user_id = (select auth.uid()) and (select public.is_active_user()))
        or (select public.is_owner())
    );

create policy progress_insert_own on public.progress
    for insert to authenticated
    with check (
        user_id = (select auth.uid())
        and (select public.is_active_user())
    );

create policy progress_update_own on public.progress
    for update to authenticated
    using (
        user_id = (select auth.uid())
        and (select public.is_active_user())
    )
    with check (
        user_id = (select auth.uid())
        and (select public.is_active_user())
    );

create policy progress_delete_own on public.progress
    for delete to authenticated
    using (
        user_id = (select auth.uid())
        and (select public.is_active_user())
    );

create policy audit_log_owner_read on public.audit_log
    for select to authenticated
    using ((select public.is_owner()));

create policy student_groups_owner_read on public.student_groups
    for select to authenticated
    using ((select public.is_owner()));

create policy group_members_owner_read on public.group_members
    for select to authenticated
    using ((select public.is_owner()));

revoke all on public.profiles, public.topics, public.plans, public.enrollments,
    public.orders, public.payments, public.progress, public.audit_log,
    public.student_groups, public.group_members
    from public, anon, authenticated;

grant select on public.topics, public.plans, public.enrollments,
    public.orders, public.payments, public.progress, public.audit_log,
    public.student_groups, public.group_members
    to authenticated;

grant select (id, display_name, role, status, is_minor, created_at)
    on public.profiles to authenticated;

grant select on public.topics, public.plans to anon;
grant insert, update, delete on public.progress to authenticated;
grant usage, select on sequence public.audit_log_id_seq to service_role;
grant all on public.profiles, public.topics, public.plans, public.enrollments,
    public.orders, public.payments, public.progress, public.audit_log,
    public.student_groups, public.group_members
    to service_role;

comment on table public.topics is
    'Public topic index only. Never store lesson or activity content in this table.';
comment on table public.enrollments is
    'Private entitlement records; mutations are restricted to trusted server functions.';
comment on table public.audit_log is
    'Append-only administrative audit records; write only from trusted server functions.';
comment on function public.is_owner() is
    'True only for an active owner with an MFA-authenticated (aal2) Supabase session.';
