-- ===========================================================================
-- 0004 · Orders, payment events, bank transfers and the audit log
--
-- The design rule for this file: it must be impossible to end up with money
-- received and no record of it, or access granted and no money trail. Every
-- transition is written to an append-only log inside the same transaction as
-- the state change it describes, so the two cannot diverge.
-- ===========================================================================

create table public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,

  -- The price is COPIED here at order time, never read live from courses.
  -- If the course price changes tomorrow, what this student owes does not.
  amount_cents bigint not null,
  currency char(3) not null default 'LKR',

  status public.order_status not null default 'pending',
  provider public.payment_provider not null default 'bank_transfer',

  -- Short human-readable code the student writes on the bank transfer, e.g.
  -- "CI-7K3M9". This is how an anonymous deposit gets matched to an order.
  reference_code text not null unique,

  -- Guards against a double-submitted checkout creating two orders.
  idempotency_key text not null unique,

  -- Gateway transaction id (PayHere later). Unique per provider so a replayed
  -- webhook cannot be processed twice.
  provider_txn_id text,

  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_amount_positive check (amount_cents > 0),
  constraint orders_currency_lkr check (currency = 'LKR'),
  constraint orders_reference_format check (reference_code ~ '^CI-[A-Z0-9]{5,10}$'),
  -- A paid order must record when. Anything else must not claim to be paid.
  constraint orders_paid_has_timestamp check (
    (status = 'paid') = (paid_at is not null)
  )
);

create unique index orders_provider_txn_key
  on public.orders (provider, provider_txn_id)
  where provider_txn_id is not null;

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
-- Supports the admin review queue, which is the busiest admin screen.
create index orders_review_queue_idx
  on public.orders (created_at)
  where status = 'under_review';

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.tg_touch_updated_at();

-- Now that orders exists, close the audit link from enrollments back to it.
alter table public.enrollments
  add constraint enrollments_source_order_fk
  foreign key (source_order_id) references public.orders (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Guard: order status is never client-writable
--
-- A student owns their order row, so RLS alone would let them PATCH
-- `status = 'paid'`. Status may only move through grant_enrollment() and the
-- other trusted functions, which set the trusted-write flag first.
-- ---------------------------------------------------------------------------

create or replace function public.tg_protect_order_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_trusted_write() or public.is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.amount_cents is distinct from old.amount_cents
     or new.paid_at is distinct from old.paid_at
     or new.provider_txn_id is distinct from old.provider_txn_id
     or new.reference_code is distinct from old.reference_code
     or new.user_id is distinct from old.user_id
     or new.course_id is distinct from old.course_id
  then
    raise exception 'Order payment columns are not directly writable'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger orders_protect_columns
  before update on public.orders
  for each row execute function public.tg_protect_order_columns();

-- ===========================================================================
-- payment_events — APPEND ONLY
--
-- The financial record of truth. Every transition, every webhook, every admin
-- click, every failure. UPDATE and DELETE are rejected at the database level,
-- so this log cannot be rewritten even by a compromised application server
-- holding the service-role key.
-- ===========================================================================

create table public.payment_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete restrict,

  type public.payment_event_type not null,
  from_status public.order_status,
  to_status public.order_status,

  -- Who caused this. Null for system/webhook-originated events.
  actor_id uuid references public.profiles (id) on delete set null,

  -- Verbatim provider payload or admin note. Stored raw and unparsed so a
  -- future dispute can be settled against exactly what we received.
  raw jsonb not null default '{}'::jsonb,
  note text,

  ip inet,
  user_agent text,

  created_at timestamptz not null default now()
);

create index payment_events_order_idx on public.payment_events (order_id, created_at);
create index payment_events_type_idx on public.payment_events (type, created_at desc);

create trigger payment_events_no_update
  before update or delete on public.payment_events
  for each statement execute function public.tg_reject_mutation();

comment on table public.payment_events is
  'Append-only financial event log. UPDATE/DELETE rejected by trigger. Never relax this.';

-- ===========================================================================
-- bank_transfers — manual deposit slips awaiting admin review
-- ===========================================================================

create table public.bank_transfers (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,

  -- Object path inside the private `payment-slips` storage bucket.
  slip_path text not null,
  depositor_name text,
  deposited_at date,
  amount_declared_cents bigint,

  submitted_at timestamptz not null default now(),

  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,

  constraint bank_transfers_declared_positive check (
    amount_declared_cents is null or amount_declared_cents > 0
  ),
  -- A review is either complete (who + when) or has not happened.
  constraint bank_transfers_review_complete check (
    (reviewed_by is null) = (reviewed_at is null)
  )
);

create index bank_transfers_pending_idx
  on public.bank_transfers (submitted_at)
  where reviewed_at is null;

-- ===========================================================================
-- audit_logs — APPEND ONLY
--
-- Non-payment administrative actions: role changes, course publishing,
-- enrollment grants and revocations, session edits.
-- ===========================================================================

create table public.audit_logs (
  id bigint generated always as identity primary key,

  actor_id uuid references public.profiles (id) on delete set null,
  actor_role public.user_role,

  -- Dotted verb, e.g. 'enrollment.granted', 'course.published'.
  action text not null,
  entity_type text not null,
  entity_id uuid,

  before jsonb,
  after jsonb,

  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

create trigger audit_logs_no_update
  before update or delete on public.audit_logs
  for each statement execute function public.tg_reject_mutation();

comment on table public.audit_logs is
  'Append-only administrative audit trail. UPDATE/DELETE rejected by trigger.';

-- ===========================================================================
-- grant_enrollment — the ONLY path from money to access
--
-- Atomic and idempotent. Either the order is marked paid, the enrollment
-- exists, the payment event is written and the audit entry is recorded — or
-- none of it happened. There is no partial outcome.
-- ===========================================================================

create or replace function public.grant_enrollment(
  p_order_id uuid,
  p_actor_id uuid default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_enrollment_id uuid;
  v_from public.order_status;
begin
  -- FOR UPDATE serialises concurrent approvals. Without this lock, two admins
  -- double-clicking Approve at the same moment could both pass the status
  -- check and both write an "enrollment_granted" event.
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order % does not exist', p_order_id using errcode = 'P0002';
  end if;

  v_from := v_order.status;

  -- Idempotency: replaying an approval is a no-op that returns the same
  -- enrollment, not an error and not a second grant.
  if v_from = 'paid' then
    select id into v_enrollment_id
    from public.enrollments
    where user_id = v_order.user_id and course_id = v_order.course_id;
    return v_enrollment_id;
  end if;

  if v_from not in ('pending', 'under_review') then
    raise exception 'Order % is % and cannot be marked paid', p_order_id, v_from
      using errcode = '22023';
  end if;

  perform set_config('app.trusted_write', 'on', true);

  update public.orders
  set status = 'paid', paid_at = now()
  where id = p_order_id;

  insert into public.enrollments (user_id, course_id, source_order_id, status)
  values (v_order.user_id, v_order.course_id, v_order.id, 'active')
  on conflict (user_id, course_id) do update
    set status = 'active',
        source_order_id = excluded.source_order_id
  returning id into v_enrollment_id;

  insert into public.payment_events (order_id, type, from_status, to_status, actor_id, note)
  values (p_order_id, 'enrollment_granted', v_from, 'paid', p_actor_id, p_note);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after)
  values (
    p_actor_id,
    'enrollment.granted',
    'enrollment',
    v_enrollment_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'course_id', v_order.course_id,
      'user_id', v_order.user_id,
      'amount_cents', v_order.amount_cents
    )
  );

  return v_enrollment_id;
end;
$$;

revoke all on function public.grant_enrollment(uuid, uuid, text) from public;
-- Callable only by trusted server code holding the service role. Deliberately
-- NOT granted to `authenticated`.
grant execute on function public.grant_enrollment(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- reject_order — the failure counterpart, logged with equal rigour
-- ---------------------------------------------------------------------------

create or replace function public.reject_order(
  p_order_id uuid,
  p_actor_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from public.order_status;
begin
  select status into v_from from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order % does not exist', p_order_id using errcode = 'P0002';
  end if;

  if v_from = 'rejected' then
    return; -- idempotent
  end if;

  if v_from not in ('pending', 'under_review') then
    raise exception 'Order % is % and cannot be rejected', p_order_id, v_from
      using errcode = '22023';
  end if;

  perform set_config('app.trusted_write', 'on', true);

  update public.orders set status = 'rejected' where id = p_order_id;

  update public.bank_transfers
  set reviewed_by = p_actor_id, reviewed_at = now(), reject_reason = p_reason
  where order_id = p_order_id;

  insert into public.payment_events (order_id, type, from_status, to_status, actor_id, note)
  values (p_order_id, 'admin_rejected', v_from, 'rejected', p_actor_id, p_reason);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after)
  values (p_actor_id, 'order.rejected', 'order', p_order_id,
          jsonb_build_object('reason', p_reason));
end;
$$;

revoke all on function public.reject_order(uuid, uuid, text) from public;
grant execute on function public.reject_order(uuid, uuid, text) to service_role;

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.bank_transfers enable row level security;
alter table public.audit_logs enable row level security;

-- --- orders ----------------------------------------------------------------

create policy "orders: read own"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()));

-- A student may open an order for a published paid course, at the current
-- listed price, in the pending state. The WITH CHECK is what stops a
-- hand-crafted request from ordering a Rs 25,000 course for Rs 1.
create policy "orders: create own at listed price"
  on public.orders for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and paid_at is null
    and provider_txn_id is null
    and currency = 'LKR'
    and exists (
      select 1 from public.courses c
      where c.id = course_id
        and c.status = 'published'
        and not c.is_free
        and c.price_cents = amount_cents
    )
  );

create policy "orders: admin full access"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- payment_events --------------------------------------------------------
-- Readable by the student it concerns (so they can see their own payment
-- history) and by admins. No INSERT policy: events are written only by
-- SECURITY DEFINER functions and service-role code.

create policy "payment_events: read own order events"
  on public.payment_events for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = payment_events.order_id and o.user_id = (select auth.uid())
    )
  );

create policy "payment_events: admin reads all"
  on public.payment_events for select
  to authenticated
  using (public.is_admin());

-- --- bank_transfers --------------------------------------------------------

create policy "bank_transfers: read own"
  on public.bank_transfers for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = bank_transfers.order_id and o.user_id = (select auth.uid())
    )
  );

-- A student uploads a slip against their own pending order, once.
create policy "bank_transfers: submit own slip"
  on public.bank_transfers for insert
  to authenticated
  with check (
    reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = (select auth.uid())
        and o.status in ('pending', 'rejected')
    )
  );

create policy "bank_transfers: admin full access"
  on public.bank_transfers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- audit_logs ------------------------------------------------------------
-- Admin-readable only. No insert policy: written by trusted functions.

create policy "audit_logs: admin reads all"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());
