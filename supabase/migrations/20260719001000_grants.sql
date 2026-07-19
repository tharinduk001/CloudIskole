-- ===========================================================================
-- 0010 · Table privileges
--
-- Postgres has two independent access layers, and BOTH must allow an
-- operation: the GRANT layer (may this role touch this table at all?) and the
-- RLS layer (which rows?). The migrations so far wrote only policies, so
-- without this file every query fails with "permission denied for table".
--
-- These grants are written explicitly rather than left to Supabase's
-- ALTER DEFAULT PRIVILEGES, because default privileges depend on which role
-- created the object — a detail that differs between a local reset and a
-- hosted project, and would make the two environments behave differently.
--
-- Granting a privilege here does NOT grant data access. RLS is deny-by-default
-- and remains the row-level gate; this only opens the outer door.
-- ===========================================================================

grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- anon — signed-out visitors
--
-- Read-only, and only on tables that carry a public-facing policy. Note the
-- tables absent from this list: profiles, orders, payment_events, audit_logs,
-- quiz_options, notifications. An anonymous request cannot reach them at the
-- GRANT layer, before RLS is even consulted.
-- ---------------------------------------------------------------------------

grant select on table
  public.courses,
  public.modules,
  public.lessons,
  public.sessions,
  public.badges
to anon;

-- The only thing a signed-out visitor may write: a message to us.
grant insert on table public.contact_messages to anon;

-- ---------------------------------------------------------------------------
-- authenticated — students and admins
--
-- Admins authenticate as `authenticated` too, so the DML they need on content
-- tables must be granted at this layer; the `is_admin()` predicate inside each
-- policy is what actually separates an admin from a student.
--
-- quiz_options is included deliberately: its ONLY policy is admin-scoped, so a
-- student holding this grant still reads zero rows. That combination is what
-- keeps the answer key unreachable while letting admins author quizzes.
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on all tables in schema public to authenticated;

-- Identity/serial columns used by tables that authenticated may insert into.
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Column-level hardening
--
-- RLS decides WHICH ROWS a user may update; it cannot restrict WHICH COLUMNS.
-- A student legitimately owns their profile row, so a row-level policy alone
-- would happily let them PATCH `role = 'admin'`.
--
-- Guard triggers were the first defence, but they depend on a transaction-
-- scoped flag — and a flag can leak between statements inside one
-- transaction. Column privileges cannot: they are enforced by the privilege
-- system itself, before any trigger runs, with nothing to bypass.
--
-- Role changes now go exclusively through public.admin_set_user_role().
-- ---------------------------------------------------------------------------

revoke update on table public.profiles from authenticated;

grant update (
  full_name,
  avatar_url,
  phone,
  district,
  al_year,
  leaderboard_opt_in,
  marketing_opt_in
) on table public.profiles to authenticated;

-- Orders are never updated over the wire. Every transition — approve, reject,
-- cancel, refund — runs through a SECURITY DEFINER function that writes the
-- matching payment_event in the same transaction. Removing UPDATE entirely
-- means there is no second path that could change money state without a log.
revoke update on table public.orders from authenticated;

-- A submitted deposit slip is evidence. Students may insert one and read it
-- back, never alter or withdraw it.
revoke update, delete on table public.bank_transfers from authenticated;
grant update on table public.bank_transfers to service_role;

-- Enrollment progress and status move only through recompute_enrollment_progress()
-- and grant_enrollment(). Without this revoke, the RLS layer is the only
-- defence, and an UPDATE a student isn't entitled to make doesn't error — it
-- silently matches zero rows (Postgres does not raise when a policy's USING
-- clause excludes a row from UPDATE, only when INSERT's WITH CHECK fails).
-- That is a genuinely worse failure mode for the app to hit by accident than
-- a loud "permission denied", which is exactly what happened here: an early
-- version of the lesson-complete flow updated this table directly, and the
-- write silently did nothing instead of erroring.
revoke update on table public.enrollments from authenticated;

-- Attempts and their answers are written by the grading functions only.
revoke insert, update, delete on table public.quiz_attempts from authenticated;
revoke insert, update, delete on table public.quiz_attempt_answers from authenticated;

-- Append-only tables: strip write privileges so the rejection happens at the
-- privilege layer, before the immutability trigger is even reached.
revoke insert, update, delete on table public.payment_events from authenticated;
revoke insert, update, delete on table public.audit_logs from authenticated;
revoke insert, update, delete on table public.xp_events from authenticated;
revoke insert, update, delete on table public.notifications from authenticated;

-- Contact messages: anyone may write one, nobody but an admin may read the
-- inbox, and a submitter cannot edit a message after sending it. Admins still
-- need to tick messages off, so only the triage columns stay writable — the
-- original name, email and message body are frozen once submitted.
revoke update, delete on table public.contact_messages from authenticated;
grant update (handled, handled_by, handled_at) on table public.contact_messages
  to authenticated;

-- ---------------------------------------------------------------------------
-- service_role — trusted server code only
-- ---------------------------------------------------------------------------

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Future objects created by this role inherit the same shape, so a later
-- migration that adds a table does not silently ship without privileges.
-- ---------------------------------------------------------------------------

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;

alter default privileges in schema public
  grant all on sequences to service_role;
