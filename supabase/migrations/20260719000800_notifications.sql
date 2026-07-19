-- ===========================================================================
-- 0008 · Notification outbox and contact messages
--
-- Outbox pattern. An action that needs to notify someone writes a row and
-- returns immediately; a worker delivers it later with retries. This means a
-- student's enrollment never fails, hangs, or half-completes because text.lk
-- or Resend happened to be down — and every attempt, including every failure,
-- is on the record.
-- ===========================================================================

create table public.notifications (
  id bigint generated always as identity primary key,

  channel public.notification_channel not null,
  -- E.164 mobile for SMS, email address for email.
  recipient text not null,
  user_id uuid references public.profiles (id) on delete set null,

  -- Template key, e.g. 'welcome', 'enrollment_confirmed', 'payment_approved',
  -- 'session_reminder_24h'. Bodies live in application code, not the database,
  -- so copy changes do not require a migration.
  template text not null,
  payload jsonb not null default '{}'::jsonb,

  status public.notification_status not null default 'queued',
  attempts smallint not null default 0,
  last_error text,

  -- Lets reminders be queued now and sent later.
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,

  -- Set for messages that must never be sent twice (e.g. one welcome SMS per
  -- user, one reminder per session per student).
  dedupe_key text,

  created_at timestamptz not null default now(),

  constraint notifications_attempts_non_negative check (attempts >= 0),
  constraint notifications_sent_has_timestamp check (
    (status = 'sent') = (sent_at is not null)
  )
);

create unique index notifications_dedupe_key_idx
  on public.notifications (dedupe_key)
  where dedupe_key is not null;

-- Drives the worker's claim query.
create index notifications_due_idx
  on public.notifications (scheduled_for)
  where status = 'queued';

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_failed_idx on public.notifications (created_at desc)
  where status = 'failed';

comment on table public.notifications is
  'Delivery outbox. Rows are claimed by the cron worker; SMS costs real money '
  'so dedupe_key exists to make double-sends impossible.';

-- ---------------------------------------------------------------------------
-- claim_notifications — hands the worker a batch, safely
--
-- SKIP LOCKED means two workers running concurrently (a retry overlapping a
-- scheduled run) never pick up the same message, so nobody gets two SMS.
-- ---------------------------------------------------------------------------

create or replace function public.claim_notifications(p_limit integer default 25)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with claimed as (
    select id
    from public.notifications
    where status = 'queued'
      and scheduled_for <= now()
      and attempts < 5
    order by scheduled_for
    limit p_limit
    for update skip locked
  )
  update public.notifications n
  set status = 'sending', attempts = n.attempts + 1
  from claimed
  where n.id = claimed.id
  returning n.*;
end;
$$;

revoke all on function public.claim_notifications(integer) from public;
grant execute on function public.claim_notifications(integer) to service_role;

-- ---------------------------------------------------------------------------

create table public.contact_messages (
  id uuid primary key default extensions.gen_random_uuid(),

  name text not null,
  email extensions.citext not null,
  phone text,
  subject text,
  message text not null,

  -- Null when sent by a signed-out visitor.
  user_id uuid references public.profiles (id) on delete set null,

  handled boolean not null default false,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,

  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),

  constraint contact_messages_name_len check (char_length(name) between 1 and 120),
  constraint contact_messages_message_len check (char_length(message) between 1 and 4000),
  constraint contact_messages_subject_len check (
    subject is null or char_length(subject) <= 200
  )
);

create index contact_messages_unhandled_idx on public.contact_messages (created_at desc)
  where not handled;

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.notifications enable row level security;
alter table public.contact_messages enable row level security;

-- Notifications carry phone numbers and message content. Admin-readable only;
-- written exclusively by trusted server code.
create policy "notifications: admin reads all"
  on public.notifications for select to authenticated
  using (public.is_admin());

-- Anyone may send us a message, including signed-out visitors. Rate limiting
-- and spam protection happen in the application layer before this insert.
create policy "contact_messages: anyone may submit"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    handled = false
    and handled_by is null
    and handled_at is null
    and (user_id is null or user_id = (select auth.uid()))
  );

-- Deliberately no student SELECT policy: a submitter cannot read the inbox,
-- not even their own message back.
create policy "contact_messages: admin full access"
  on public.contact_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
