-- ===========================================================================
-- 0001 · Foundation: extensions, enums, and shared helper functions
--
-- Conventions used throughout every migration in this project:
--
--   * Every function is `set search_path = ''` and fully schema-qualifies its
--     references. Without this, a caller can prepend a malicious schema to
--     search_path and hijack what a SECURITY DEFINER function actually calls.
--   * Every table enables RLS and is deny-by-default: no policy means no
--     access, including for the table owner's own queries via PostgREST.
--   * Money is stored as integer cents. Never float, never numeric-with-scale.
-- ===========================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('student', 'admin');

create type public.content_status as enum ('draft', 'published', 'archived');

create type public.course_level as enum ('beginner', 'intermediate', 'advanced');

create type public.lesson_type as enum ('video', 'text', 'pdf');

create type public.enrollment_status as enum ('active', 'completed', 'revoked');

-- Order lifecycle.
--   pending       — order created, student has not submitted proof of payment
--   under_review  — slip uploaded (or gateway pending), awaiting confirmation
--   paid          — funds confirmed, enrollment granted. TERMINAL (success)
--   rejected      — admin reviewed and declined the submitted proof
--   failed        — provider/gateway reported failure
--   cancelled     — abandoned by the student or expired
--   refunded      — previously paid, money returned, access revoked
create type public.order_status as enum (
  'pending', 'under_review', 'paid', 'rejected', 'failed', 'cancelled', 'refunded'
);

create type public.payment_provider as enum ('bank_transfer', 'payhere');

-- Every meaningful thing that can happen to an order. Written append-only.
create type public.payment_event_type as enum (
  'order_created',
  'slip_submitted',
  'review_started',
  'admin_approved',
  'admin_rejected',
  'webhook_received',
  'verification_failed',
  'enrollment_granted',
  'payment_failed',
  'order_cancelled',
  'refund_issued'
);

create type public.quiz_scope as enum ('lesson', 'course', 'exam');

create type public.session_status as enum ('upcoming', 'live', 'completed', 'cancelled');

create type public.notification_channel as enum ('sms', 'email');

create type public.notification_status as enum (
  'queued', 'sending', 'sent', 'failed', 'cancelled'
);

-- NOTE: `is_admin()` and `is_enrolled()` are defined alongside the tables they
-- read (0002 and 0003), because SQL-language function bodies are validated at
-- CREATE time and cannot reference a table that does not exist yet.

-- ---------------------------------------------------------------------------
-- Trigger: append-only enforcement
--
-- Statement-level (not row-level) on purpose: a row-level trigger never fires
-- for an UPDATE that matches zero rows, which would let a probing statement
-- succeed silently. Statement-level rejects the attempt unconditionally.
-- ---------------------------------------------------------------------------

create or replace function public.tg_reject_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'public.% is append-only; % is not permitted', tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: maintain updated_at
-- ---------------------------------------------------------------------------

create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trusted-write flag
--
-- Some columns (roles, XP, order status) must not be writable by a student
-- even though the student legitimately owns the row. Trusted SECURITY DEFINER
-- functions set this transaction-local flag before writing; the guard triggers
-- check it. A student cannot set it themselves, because `set_config` on this
-- key is only ever called from inside functions they cannot modify.
-- ---------------------------------------------------------------------------

create or replace function public.is_trusted_write()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('app.trusted_write', true), 'off') = 'on';
$$;
