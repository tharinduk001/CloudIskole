-- ===========================================================================
-- 0015 · Session access hardening, reminders, registration notice
--
-- 0006_sessions.sql shipped a `sessions_public` view specifically because
-- `join_url` "must not be [public] ... Postgres RLS is row-level, not
-- column-level" (its own comment). But the base table's SELECT policy
-- ("anyone reads non-draft sessions") is granted to `authenticated` as well
-- as `anon`, and the table-level GRANT from 0010 covers every column — so
-- any signed-in student, registered or not, could read `join_url` straight
-- off `public.sessions` and skip the view entirely. A row-level policy can't
-- close this: the same row must show a different set of columns depending
-- on whether the reader has registered. That needs either a column-level
-- privilege or a function; column-level privileges can't work either, since
-- admins and students share the `authenticated` database role. So: revoke
-- SELECT on the base table outright, and read it exclusively through
-- `sessions_public` (no join_url) or `get_session_join_url()` (join_url,
-- gated) below. Admin management of `sessions` (which does need to read and
-- write join_url in the same request) moves to the service-role client —
-- the same "narrow, deliberate" exception already used for payment slips and
-- the notification outbox.
-- ===========================================================================

-- Column-level, not a full table revoke: the existing "register self" /
-- "cancel own" policies on session_registrations (0006) each carry a
-- `select 1 from public.sessions where id = ... and status = 'upcoming'`
-- inside their WITH CHECK/USING clause. RLS policy subqueries run under the
-- querying role's own privileges, not the policy owner's, so a full revoke
-- of SELECT on `sessions` would have silently broken registration itself,
-- not just join_url secrecy. Revoking only the one sensitive column keeps
-- every other read (including those RLS subqueries) working exactly as
-- before.
revoke select on table public.sessions from anon, authenticated;
grant select (
  id, slug, title, description, cover_image_path,
  starts_at, duration_minutes, host_name,
  capacity, is_free, course_id, status, recording_url,
  created_at, updated_at
) on table public.sessions to anon, authenticated;

-- ---------------------------------------------------------------------------
-- session_seats_taken — the one aggregate a public listing needs
--
-- A plain correlated subquery inside `sessions_public` would run under the
-- caller's own RLS on `session_registrations` ("read own"), so an ordinary
-- student would see either 0 or 1 registered, never the real total. A
-- SECURITY DEFINER function ignores the view's `security_invoker` setting for
-- its own body, so this returns the true count while still revealing nothing
-- beyond a number.
-- ---------------------------------------------------------------------------

create or replace function public.session_seats_taken(p_session_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.session_registrations
  where session_id = p_session_id;
$$;

revoke all on function public.session_seats_taken(uuid) from public;
grant execute on function public.session_seats_taken(uuid) to anon, authenticated;

create or replace view public.sessions_public
with (security_invoker = true)
as
select
  id, slug, title, description, cover_image_path,
  starts_at, duration_minutes, host_name,
  capacity, is_free, course_id, status, recording_url,
  created_at,
  public.session_seats_taken(id) as registered_count
from public.sessions
where status <> 'cancelled';

comment on view public.sessions_public is
  'Session listing without join_url, plus a true registered_count. '
  'security_invoker keeps the caller''s RLS in force for the base columns; '
  'registered_count comes from a SECURITY DEFINER function so it is accurate '
  'for every reader, not just the count of rows their own RLS would show.';

grant select on public.sessions_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_session_join_url — the private link, gated by registration and time
--
-- Revealed to: an admin (always), or a registered student once the session
-- is 'live' or starting within 15 minutes. Outside that window a registered
-- student gets null back, not an error — the UI shows "link opens closer to
-- start time" rather than treating it as a failure.
-- ---------------------------------------------------------------------------

create or replace function public.get_session_join_url(p_session_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session public.sessions;
begin
  if v_user_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    raise exception 'Session % not found', p_session_id using errcode = 'P0002';
  end if;

  if public.is_admin() then
    return v_session.join_url;
  end if;

  if not exists (
    select 1 from public.session_registrations
    where session_id = p_session_id and user_id = v_user_id
  ) then
    raise exception 'You are not registered for this session' using errcode = '42501';
  end if;

  if v_session.status = 'live'
     or (v_session.status = 'upcoming' and v_session.starts_at <= now() + interval '15 minutes')
  then
    return v_session.join_url;
  end if;

  return null;
end;
$$;

revoke all on function public.get_session_join_url(uuid) from public;
grant execute on function public.get_session_join_url(uuid) to authenticated;

-- ===========================================================================
-- Registration confirmation — fires regardless of which app code path wrote
-- the row, since the outbox insert happens inside the trigger rather than in
-- application code after the fact.
-- ===========================================================================

create or replace function public.tg_notify_session_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions;
  v_email extensions.citext;
begin
  select * into v_session from public.sessions where id = new.session_id;
  select email into v_email from public.profiles where id = new.user_id;

  if v_email is null then
    return new;
  end if;

  insert into public.notifications (channel, recipient, user_id, template, payload, dedupe_key)
  values (
    'email', v_email::text, new.user_id, 'session_registration_confirmed',
    jsonb_build_object(
      'subject', 'You''re registered: ' || v_session.title,
      'html', 'You''re registered for "' || v_session.title || '" on ' ||
              to_char(v_session.starts_at at time zone 'Asia/Colombo', 'FMDD Mon YYYY, HH12:MI AM') ||
              ' Colombo time. We''ll email the join link closer to the start.'
    ),
    'session-register-' || new.id::text
  )
  on conflict (dedupe_key) where dedupe_key is not null do nothing;

  return new;
end;
$$;

create trigger session_registrations_notify
  after insert on public.session_registrations
  for each row execute function public.tg_notify_session_registration();

-- ===========================================================================
-- Reminders — 24h and 1h before start, one each per registration
-- ===========================================================================

alter table public.session_registrations
  add column reminder_24h_sent_at timestamptz,
  add column reminder_1h_sent_at timestamptz;

create or replace function public.enqueue_session_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in
    select sr.id as reg_id, sr.user_id, s.title, s.starts_at, p.email
    from public.session_registrations sr
    join public.sessions s on s.id = sr.session_id
    join public.profiles p on p.id = sr.user_id
    where sr.reminder_24h_sent_at is null
      and s.status = 'upcoming'
      and s.starts_at between now() and now() + interval '24 hours'
      and p.email is not null
    for update of sr skip locked
  loop
    insert into public.notifications (channel, recipient, user_id, template, payload, dedupe_key)
    values (
      'email', v_row.email::text, v_row.user_id, 'session_reminder_24h',
      jsonb_build_object(
        'subject', 'Tomorrow: ' || v_row.title,
        'html', 'Your session "' || v_row.title || '" starts ' ||
                to_char(v_row.starts_at at time zone 'Asia/Colombo', 'FMDD Mon, HH12:MI AM') ||
                ' Colombo time. Sign in to CloudIskole shortly before it starts to get the join link.'
      ),
      'session-reminder-24h-' || v_row.reg_id::text
    )
    on conflict (dedupe_key) where dedupe_key is not null do nothing;

    update public.session_registrations set reminder_24h_sent_at = now() where id = v_row.reg_id;
    v_count := v_count + 1;
  end loop;

  for v_row in
    select sr.id as reg_id, sr.user_id, s.title, s.starts_at, p.email
    from public.session_registrations sr
    join public.sessions s on s.id = sr.session_id
    join public.profiles p on p.id = sr.user_id
    where sr.reminder_1h_sent_at is null
      and s.status = 'upcoming'
      and s.starts_at between now() and now() + interval '1 hour'
      and p.email is not null
    for update of sr skip locked
  loop
    insert into public.notifications (channel, recipient, user_id, template, payload, dedupe_key)
    values (
      'email', v_row.email::text, v_row.user_id, 'session_reminder_1h',
      jsonb_build_object(
        'subject', v_row.title || ' starts within the hour',
        'html', 'Your session "' || v_row.title || '" is starting soon. Sign in to CloudIskole to get the join link.'
      ),
      'session-reminder-1h-' || v_row.reg_id::text
    )
    on conflict (dedupe_key) where dedupe_key is not null do nothing;

    update public.session_registrations set reminder_1h_sent_at = now() where id = v_row.reg_id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.enqueue_session_reminders() from public;
grant execute on function public.enqueue_session_reminders() to service_role;
