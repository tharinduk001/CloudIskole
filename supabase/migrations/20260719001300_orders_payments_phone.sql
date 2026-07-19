-- ===========================================================================
-- 0013 · Order creation, bank-transfer slip submission, and phone OTP
--
-- Phase 3. Orders, payment_events, bank_transfers and grant_enrollment() /
-- reject_order() already exist (0004). What's missing is the student-facing
-- half: a trusted way to open an order at the listed price with a unique
-- reference code, and a trusted way to (re)submit a deposit slip — both need
-- to move `orders.status`, which `tg_protect_order_columns` deliberately
-- blocks for direct writes. Same pattern as grant_enrollment(): SECURITY
-- DEFINER, set the trusted-write flag, log every transition.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- create_order — open a pending order for a paid, published course
--
-- Idempotent: replaying this for a course the student already has an open
-- order for returns that order instead of creating a second one, so a
-- double-submitted checkout form cannot produce two reference codes.
-- ---------------------------------------------------------------------------

create or replace function public.create_order(p_course_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_course public.courses;
  v_order public.orders;
  v_reference text;
begin
  if v_user_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.enrollments
    where user_id = v_user_id and course_id = p_course_id and status in ('active', 'completed')
  ) then
    raise exception 'Already enrolled in this course' using errcode = '22023';
  end if;

  select * into v_course from public.courses where id = p_course_id for share;

  if not found or v_course.status <> 'published' or v_course.is_free then
    raise exception 'Course is not available for paid enrollment' using errcode = 'P0002';
  end if;

  -- Reuse an order the student already opened for this course that hasn't
  -- reached a terminal failure/success state, rather than minting a new
  -- reference code every time they revisit the checkout page.
  select * into v_order
  from public.orders
  where user_id = v_user_id and course_id = p_course_id
    and status in ('pending', 'under_review')
  order by created_at desc
  limit 1;

  if found then
    return v_order;
  end if;

  loop
    v_reference := 'CI-' || upper(substr(encode(extensions.gen_random_bytes(5), 'hex'), 1, 7));
    exit when not exists (select 1 from public.orders where reference_code = v_reference);
  end loop;

  perform set_config('app.trusted_write', 'on', true);

  insert into public.orders (
    user_id, course_id, amount_cents, currency, status, provider,
    reference_code, idempotency_key
  )
  values (
    v_user_id, p_course_id, v_course.price_cents, 'LKR', 'pending', 'bank_transfer',
    v_reference, extensions.gen_random_uuid()::text
  )
  returning * into v_order;

  insert into public.payment_events (order_id, type, from_status, to_status, actor_id)
  values (v_order.id, 'order_created', null, 'pending', v_user_id);

  return v_order;
end;
$$;

revoke all on function public.create_order(uuid) from public;
grant execute on function public.create_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_bank_transfer_slip — (re)submit proof of a bank deposit
--
-- Allowed from 'pending' (first submission) or 'rejected' (resubmission
-- after an admin declined the first slip). Upserts bank_transfers so a
-- resubmission clears the previous reviewer's verdict rather than stacking a
-- second row against the same order.
-- ---------------------------------------------------------------------------

create or replace function public.submit_bank_transfer_slip(
  p_order_id uuid,
  p_slip_path text,
  p_depositor_name text default null,
  p_deposited_at date default null,
  p_amount_declared_cents bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found or v_order.user_id <> v_user_id then
    raise exception 'Order % does not exist', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status not in ('pending', 'rejected') then
    raise exception 'Order % is % and cannot accept a slip', p_order_id, v_order.status
      using errcode = '22023';
  end if;

  perform set_config('app.trusted_write', 'on', true);

  insert into public.bank_transfers (
    order_id, slip_path, depositor_name, deposited_at, amount_declared_cents, submitted_at
  )
  values (p_order_id, p_slip_path, p_depositor_name, p_deposited_at, p_amount_declared_cents, now())
  on conflict (order_id) do update
    set slip_path = excluded.slip_path,
        depositor_name = excluded.depositor_name,
        deposited_at = excluded.deposited_at,
        amount_declared_cents = excluded.amount_declared_cents,
        submitted_at = now(),
        reviewed_by = null,
        reviewed_at = null,
        reject_reason = null;

  update public.orders set status = 'under_review' where id = p_order_id;

  insert into public.payment_events (order_id, type, from_status, to_status, actor_id)
  values (p_order_id, 'slip_submitted', v_order.status, 'under_review', v_user_id);
end;
$$;

revoke all on function public.submit_bank_transfer_slip(uuid, text, text, date, bigint) from public;
grant execute on function public.submit_bank_transfer_slip(uuid, text, text, date, bigint) to authenticated;

-- ===========================================================================
-- Phone verification — one SMS OTP at first paid enrollment
--
-- Deliberately not Supabase Auth's built-in phone provider: that requires a
-- Twilio/MessageBird/Vonage account, and text.lk (the Sri Lankan SMS provider
-- chosen for cost) isn't one of the supported drivers. This is a small,
-- self-contained OTP table instead — same trust model as everything else
-- here: the code's hash lives in the database, the raw code is generated
-- inside the SECURITY DEFINER function and handed back once for the caller
-- to send over SMS, and it is never stored or logged in the clear.
-- ===========================================================================

create table public.phone_otp_codes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint phone_otp_attempts_bounded check (attempts >= 0 and attempts <= 5)
);

create index phone_otp_codes_user_idx on public.phone_otp_codes (user_id, created_at desc);

alter table public.phone_otp_codes enable row level security;
-- No policies: this table is reachable only through the two SECURITY DEFINER
-- functions below, never directly via PostgREST — including for admins.

-- ---------------------------------------------------------------------------
-- request_phone_otp — generate and record a code, rate-limited
-- ---------------------------------------------------------------------------

create or replace function public.request_phone_otp(p_phone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text;
  v_last_created_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;

  if p_phone !~ '^\+94[0-9]{9}$' then
    raise exception 'Phone must be a Sri Lankan number in +94XXXXXXXXX format'
      using errcode = '22023';
  end if;

  select created_at into v_last_created_at
  from public.phone_otp_codes
  where user_id = v_user_id
  order by created_at desc
  limit 1;

  if v_last_created_at is not null and v_last_created_at > now() - interval '60 seconds' then
    raise exception 'Please wait before requesting another code' using errcode = '22023';
  end if;

  v_code := lpad(floor(random() * 1000000)::text, 6, '0');

  insert into public.phone_otp_codes (user_id, phone, code_hash, expires_at)
  values (v_user_id, p_phone, encode(extensions.digest(v_code, 'sha256'), 'hex'), now() + interval '10 minutes');

  -- Trusted write bypasses tg_protect_profile_columns entirely, including the
  -- clause that auto-nulls phone_verified_at when the number changes — so
  -- that has to happen here explicitly, or a student could request a code
  -- for a NEW number while a stale verified_at from a previous number stays
  -- on the row.
  perform set_config('app.trusted_write', 'on', true);
  update public.profiles set phone = p_phone, phone_verified_at = null where id = v_user_id;

  return v_code;
end;
$$;

revoke all on function public.request_phone_otp(text) from public;
grant execute on function public.request_phone_otp(text) to authenticated;

-- ---------------------------------------------------------------------------
-- verify_phone_otp — check the code the student typed back in
-- ---------------------------------------------------------------------------

create or replace function public.verify_phone_otp(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.phone_otp_codes;
begin
  if v_user_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;

  select * into v_row
  from public.phone_otp_codes
  where user_id = v_user_id and consumed_at is null and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    return false;
  end if;

  if v_row.attempts >= 5 then
    return false;
  end if;

  update public.phone_otp_codes set attempts = attempts + 1 where id = v_row.id;

  if v_row.code_hash <> encode(extensions.digest(p_code, 'sha256'), 'hex') then
    return false;
  end if;

  update public.phone_otp_codes set consumed_at = now() where id = v_row.id;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles set phone_verified_at = now() where id = v_user_id;

  return true;
end;
$$;

revoke all on function public.verify_phone_otp(text) from public;
grant execute on function public.verify_phone_otp(text) to authenticated;
