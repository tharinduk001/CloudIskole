-- ===========================================================================
-- Adversarial RLS / integrity test suite
--
-- Run with:  npm run db:test
--
-- Every assertion here is written from the attacker's point of view: it tries
-- to do the forbidden thing and fails the suite if it SUCCEEDS. A policy that
-- is merely "probably right" is not good enough for the payment and answer-key
-- tables, so this file proves the boundaries rather than trusting them.
--
-- Wrapped in a transaction and rolled back, so it leaves no residue.
-- ===========================================================================

\set ON_ERROR_STOP on

begin;

create schema if not exists tests;

create or replace function tests.ok(cond boolean, msg text)
returns void language plpgsql as $$
begin
  if cond then
    raise notice '  PASS  %', msg;
  else
    raise exception 'FAIL  %', msg;
  end if;
end $$;

/** Runs `stmt` and asserts it raises. Used for "this must be blocked" cases. */
create or replace function tests.must_fail(stmt text, msg text)
returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice '  PASS  % (blocked: %)', msg, replace(sqlerrm, E'\n', ' ');
    return;
  end;
  raise exception 'FAIL  % — the statement SUCCEEDED but should have been blocked', msg;
end $$;

/** Impersonates a signed-in Supabase user for subsequent statements. */
create or replace function tests.act_as(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.act_as_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
end $$;

-- The assertion helpers are called while impersonating anon/authenticated, so
-- those roles need to reach them. They are SECURITY INVOKER, so this grants no
-- data access — only the ability to run the assertions themselves.
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fixtures (created as superuser)
-- ---------------------------------------------------------------------------

\set alice '11111111-1111-4111-8111-111111111111'
\set bob   '22222222-2222-4222-8222-222222222222'
\set admin '33333333-3333-4333-8333-333333333333'

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  (:'alice', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'alice@test.lk', '', now(), now(), now(), '{}', '{"full_name":"Alice Perera"}'),
  (:'bob', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'bob@test.lk', '', now(), now(), now(), '{}', '{"full_name":"Bob Silva"}'),
  (:'admin', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@test.lk', '', now(), now(), now(), '{}', '{"full_name":"Site Admin"}');

-- The signup trigger should have created all three profiles.
select tests.ok(
  (select count(*) from public.profiles
   where id in (:'alice', :'bob', :'admin')) = 3,
  'signup trigger auto-creates a profile for each new auth user'
);

select tests.ok(
  (select full_name from public.profiles where id = :'alice') = 'Alice Perera',
  'signup trigger copies full_name out of Google/OAuth metadata'
);

-- Promote the admin (superuser bypasses the guard trigger legitimately).
update public.profiles set role = 'admin' where id = :'admin';

-- Courses
insert into public.courses (id, slug, title, is_free, price_cents, status)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'linux-basics', 'Linux Basics',
   true, 0, 'published'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'devops-pro', 'DevOps Engineering',
   false, 2500000, 'published'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'secret-draft', 'Unreleased Course',
   true, 0, 'draft');

insert into public.modules (id, course_id, title)
values
  ('bbbbbbbb-0000-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000002', 'Module 1'),
  -- Gives the free course (which Alice can actually self-enroll in) a real
  -- lesson of its own, so the progress/completion tests below exercise the
  -- course a student can genuinely reach 100% of, rather than a lesson that
  -- happens to share an id prefix with a different, paid course.
  ('bbbbbbbb-0000-4000-8000-000000000002',
   'aaaaaaaa-0000-4000-8000-000000000001', 'Getting Started');

insert into public.lessons (id, module_id, course_id, title, slug, type, content_mdx, is_preview)
values
  -- Not a preview lesson: Alice reaches it via her enrollment, not via the
  -- public-preview policy, so this does not disturb the anon preview-count
  -- assertions below (which expect exactly one public preview lesson).
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002',
   'aaaaaaaa-0000-4000-8000-000000000001', 'Intro to Linux', 'intro-to-linux',
   'text', 'Welcome content', false),
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000002', 'Free Preview', 'free-preview',
   'text', 'Preview content', true),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000002', 'Paid Lesson', 'paid-lesson',
   'text', 'The paid material', false);

-- A quiz with a known answer key
insert into public.quizzes (id, scope, course_id, slug, title, status)
values ('dddddddd-0000-4000-8000-000000000001', 'course',
        'aaaaaaaa-0000-4000-8000-000000000002', 'devops-quiz', 'DevOps Quiz', 'published');

insert into public.quiz_questions (id, quiz_id, body, explanation)
values ('eeeeeeee-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
        'Which command lists running containers?', 'docker ps shows running containers.');

insert into public.quiz_options (id, question_id, body, is_correct)
values
  ('ffffffff-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001',
   'docker ps', true),
  ('ffffffff-0000-4000-8000-000000000002', 'eeeeeeee-0000-4000-8000-000000000001',
   'docker rm', false);

-- ===========================================================================
-- 1 · Anonymous visitors
-- ===========================================================================

savepoint s1;
select tests.act_as_anon();

-- Counts below are scoped to this file's own fixture rows (id LIKE
-- 'aaaaaaaa-%' etc.) rather than the whole table, so this suite gives the
-- same result whether run against an empty database or one already carrying
-- seed/production data.
select tests.ok(
  (select count(*) from public.courses where id::text like 'aaaaaaaa-%') = 2,
  'anon sees only the 2 published fixture courses, not the draft'
);

select tests.ok(
  (select count(*) from public.courses
   where slug = 'secret-draft') = 0,
  'anon cannot read a draft course'
);

select tests.ok(
  (select count(*) from public.lessons where id::text like 'cccccccc-%') = 1,
  'anon sees only the preview fixture lesson, not the paid one'
);

-- These tables carry no grant for anon at all, so the request is refused at
-- the privilege layer before RLS is consulted — one layer stricter than
-- "returns zero rows".
select tests.must_fail(
  'select count(*) from public.profiles',
  'anon cannot read any profile'
);

select tests.must_fail(
  'select count(*) from public.quiz_options',
  'anon cannot read the answer key'
);

select tests.must_fail(
  'select count(*) from public.orders',
  'anon cannot read orders'
);

select tests.must_fail(
  'select count(*) from public.payment_events',
  'anon cannot read payment events'
);

select tests.must_fail(
  'select count(*) from public.audit_logs',
  'anon cannot read the audit log'
);

rollback to savepoint s1;

-- ===========================================================================
-- 2 · Student isolation
-- ===========================================================================

savepoint s2;
select tests.act_as(:'alice');

select tests.ok(
  (select count(*) from public.profiles) = 1,
  'a student sees exactly one profile — their own'
);

select tests.ok(
  (select count(*) from public.profiles where id = :'bob') = 0,
  'Alice cannot read Bob''s profile'
);

select tests.ok(
  (select count(*) from public.audit_logs) = 0,
  'a student cannot read the audit log'
);

select tests.ok(
  (select count(*) from public.contact_messages) = 0,
  'a student cannot read the contact inbox'
);

-- Privilege escalation
select tests.must_fail(
  format('update public.profiles set role = ''admin'' where id = %L', :'alice'),
  'Alice cannot promote herself to admin'
);

select tests.must_fail(
  format('update public.profiles set phone_verified_at = now() where id = %L', :'alice'),
  'Alice cannot self-assert phone verification without an OTP'
);

rollback to savepoint s2;

-- ===========================================================================
-- 3 · The answer key  ← the property the whole quiz feature rests on
-- ===========================================================================

savepoint s3;
select tests.act_as(:'alice');

select tests.ok(
  (select count(*) from public.quiz_options) = 0,
  'ENROLLED-OR-NOT: a student reading quiz_options directly gets zero rows'
);

select tests.ok(
  (select count(*) from public.quiz_options where is_correct) = 0,
  'a student filtering on is_correct still gets nothing (no oracle attack)'
);

select tests.ok(
  (select count(*) from public.quiz_questions) = 0,
  'a student cannot read quiz_questions directly (explanations stay hidden)'
);

rollback to savepoint s3;

-- ===========================================================================
-- 4 · Paid content requires enrollment
-- ===========================================================================

savepoint s4;
select tests.act_as(:'alice');

select tests.ok(
  (select count(*) from public.lessons
   where id = 'cccccccc-0000-4000-8000-000000000002') = 0,
  'an unenrolled student cannot read a paid lesson'
);

-- Self-enrolling in a PAID course must be impossible.
select tests.must_fail(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         :'alice', 'aaaaaaaa-0000-4000-8000-000000000002'),
  'Alice cannot self-enroll in a paid course'
);

-- Self-enrolling in a FREE course is allowed by design.
insert into public.enrollments (user_id, course_id)
values (:'alice', 'aaaaaaaa-0000-4000-8000-000000000001');

select tests.ok(
  (select count(*) from public.enrollments where user_id = :'alice') = 1,
  'Alice CAN self-enroll in a free course'
);

-- Progress can only move through recompute_enrollment_progress(), never by
-- writing progress_pct/status directly. UPDATE is revoked from `authenticated`
-- at the table-grant level (see 20260719001000_grants.sql) specifically so
-- this fails LOUDLY — an RLS-only defence would let the statement "succeed"
-- while silently matching zero rows, which is the actual bug this migration
-- fixes: an earlier version of the lesson-complete flow updated this table
-- directly and the write silently did nothing.
select tests.act_as(:'alice');

select tests.must_fail(
  format('update public.enrollments set progress_pct = 100 where user_id = %L', :'alice'),
  'Alice cannot set her own progress_pct directly (permission denied, not a silent no-op)'
);

select tests.must_fail(
  format($f$update public.enrollments set status = 'completed', completed_at = now()
           where user_id = %L$f$, :'alice'),
  'Alice cannot mark her own enrollment completed directly'
);

select public.recompute_enrollment_progress('aaaaaaaa-0000-4000-8000-000000000001');

select tests.ok(
  (select progress_pct from public.enrollments where user_id = :'alice') = 0,
  'recompute_enrollment_progress correctly reports 0% before any lesson is completed'
);
reset role;

-- Superuser marks Alice's one lesson in this course complete, then Alice
-- recomputes her own progress (the actual call path the app uses).
insert into public.lesson_progress (user_id, lesson_id, course_id, completed_at)
values (:'alice', 'cccccccc-0000-4000-8000-000000000003',
        'aaaaaaaa-0000-4000-8000-000000000001', now());

select tests.act_as(:'alice');
select public.recompute_enrollment_progress('aaaaaaaa-0000-4000-8000-000000000001');

select tests.ok(
  (select progress_pct from public.enrollments where user_id = :'alice') = 100,
  'recompute_enrollment_progress reaches 100% once the (single) lesson is done'
);
select tests.ok(
  (select status from public.enrollments where user_id = :'alice') = 'completed',
  'recompute_enrollment_progress flips status to completed at 100%'
);

select tests.must_fail(
  format($f$select public.recompute_enrollment_progress(
             'aaaaaaaa-0000-4000-8000-000000000001', %L)$f$, :'bob'),
  'Alice cannot recompute progress on Bob''s behalf'
);
reset role;

rollback to savepoint s4;

-- ===========================================================================
-- 5 · Order integrity — price tampering
-- ===========================================================================

savepoint s5;
select tests.act_as(:'alice');

select tests.must_fail(
  format($f$insert into public.orders
           (user_id, course_id, amount_cents, reference_code, idempotency_key)
           values (%L, %L, 1, 'CI-CHEAT1', 'k-cheat')$f$,
         :'alice', 'aaaaaaaa-0000-4000-8000-000000000002'),
  'Alice cannot order a Rs 25,000 course for 1 cent'
);

select tests.must_fail(
  format($f$insert into public.orders
           (user_id, course_id, amount_cents, reference_code, idempotency_key, status, paid_at)
           values (%L, %L, 2500000, 'CI-CHEAT2', 'k-cheat2', 'paid', now())$f$,
         :'alice', 'aaaaaaaa-0000-4000-8000-000000000002'),
  'Alice cannot create an order that is already marked paid'
);

select tests.must_fail(
  format($f$insert into public.orders
           (user_id, course_id, amount_cents, reference_code, idempotency_key)
           values (%L, %L, 2500000, 'CI-FORBOB', 'k-bob')$f$,
         :'bob', 'aaaaaaaa-0000-4000-8000-000000000002'),
  'Alice cannot create an order in Bob''s name'
);

-- A correctly-priced order is allowed.
insert into public.orders (user_id, course_id, amount_cents, reference_code, idempotency_key)
values (:'alice', 'aaaaaaaa-0000-4000-8000-000000000002', 2500000, 'CI-GOOD01', 'k-good');

select tests.ok(
  (select count(*) from public.orders where reference_code = 'CI-GOOD01') = 1,
  'Alice CAN create an order at the correct listed price'
);

-- ...but cannot then mark her own order paid.
select tests.must_fail(
  $f$update public.orders set status = 'paid', paid_at = now()
     where reference_code = 'CI-GOOD01'$f$,
  'Alice cannot mark her own order as paid'
);

rollback to savepoint s5;

-- ===========================================================================
-- 6 · Append-only logs
-- ===========================================================================

savepoint s6;

insert into public.orders (id, user_id, course_id, amount_cents, reference_code, idempotency_key)
values ('99999999-0000-4000-8000-000000000001', :'alice',
        'aaaaaaaa-0000-4000-8000-000000000002', 2500000, 'CI-LOG001', 'k-log');

insert into public.payment_events (order_id, type, note)
values ('99999999-0000-4000-8000-000000000001', 'order_created', 'original');

-- Note: these run as SUPERUSER. Even the most privileged database role — and
-- therefore anything holding the service-role key — cannot rewrite history.
select tests.must_fail(
  $f$update public.payment_events set note = 'tampered'$f$,
  'even a superuser cannot UPDATE payment_events'
);

select tests.must_fail(
  $f$delete from public.payment_events$f$,
  'even a superuser cannot DELETE payment_events'
);

insert into public.audit_logs (action, entity_type) values ('test.action', 'test');

select tests.must_fail(
  $f$update public.audit_logs set action = 'tampered'$f$,
  'even a superuser cannot UPDATE audit_logs'
);

select tests.must_fail(
  $f$delete from public.audit_logs$f$,
  'even a superuser cannot DELETE audit_logs'
);

rollback to savepoint s6;

-- ===========================================================================
-- 7 · grant_enrollment — atomicity and idempotency
-- ===========================================================================

savepoint s7;

insert into public.orders (id, user_id, course_id, amount_cents, reference_code, idempotency_key)
values ('99999999-0000-4000-8000-000000000002', :'bob',
        'aaaaaaaa-0000-4000-8000-000000000002', 2500000, 'CI-GRANT1', 'k-grant');

select public.grant_enrollment('99999999-0000-4000-8000-000000000002', :'admin', 'slip ok')
  as first_grant \gset

select tests.ok(
  (select status from public.orders
   where id = '99999999-0000-4000-8000-000000000002') = 'paid',
  'grant_enrollment marks the order paid'
);

select tests.ok(
  (select count(*) from public.enrollments
   where user_id = :'bob' and course_id = 'aaaaaaaa-0000-4000-8000-000000000002') = 1,
  'grant_enrollment creates the enrollment'
);

select tests.ok(
  (select count(*) from public.payment_events
   where order_id = '99999999-0000-4000-8000-000000000002'
     and type = 'enrollment_granted') = 1,
  'grant_enrollment writes an enrollment_granted payment event'
);

select tests.ok(
  (select count(*) from public.audit_logs
   where action = 'enrollment.granted'
     and after ->> 'order_id' = '99999999-0000-4000-8000-000000000002') = 1,
  'grant_enrollment writes an audit log entry'
);

select tests.ok(
  (select source_order_id from public.enrollments
   where user_id = :'bob' and course_id = 'aaaaaaaa-0000-4000-8000-000000000002')
   = '99999999-0000-4000-8000-000000000002',
  'the enrollment links back to the order that paid for it'
);

-- Replay: a double-clicked Approve button must not grant twice.
select public.grant_enrollment('99999999-0000-4000-8000-000000000002', :'admin', 'replay')
  as second_grant \gset

select tests.ok(
  :'first_grant' = :'second_grant',
  'replaying grant_enrollment returns the SAME enrollment (idempotent)'
);

select tests.ok(
  (select count(*) from public.enrollments
   where user_id = :'bob' and course_id = 'aaaaaaaa-0000-4000-8000-000000000002') = 1,
  'replaying grant_enrollment does not create a second enrollment'
);

select tests.ok(
  (select count(*) from public.payment_events
   where order_id = '99999999-0000-4000-8000-000000000002'
     and type = 'enrollment_granted') = 1,
  'replaying grant_enrollment does not double-log the grant'
);

-- Bob can now read the paid lesson he paid for.
select tests.act_as(:'bob');
select tests.ok(
  (select count(*) from public.lessons
   where id = 'cccccccc-0000-4000-8000-000000000002') = 1,
  'after enrollment, Bob CAN read the paid lesson'
);
select tests.ok(
  (select count(*) from public.payment_events) >= 1,
  'Bob can read the payment history of his own order'
);
reset role;

-- Alice, who did not pay, still cannot.
select tests.act_as(:'alice');
select tests.ok(
  (select count(*) from public.lessons
   where id = 'cccccccc-0000-4000-8000-000000000002') = 0,
  'Bob''s payment does not grant Alice access'
);
select tests.ok(
  (select count(*) from public.payment_events) = 0,
  'Alice cannot read Bob''s payment events'
);
reset role;

rollback to savepoint s7;

-- ===========================================================================
-- 8 · Free courses cannot carry a price (data-level invariant)
-- ===========================================================================

savepoint s8;

select tests.must_fail(
  $f$insert into public.courses (slug, title, is_free, price_cents, status)
     values ('bad-free', 'Free But Charged', true, 500000, 'published')$f$,
  'a course cannot be free AND priced'
);

select tests.must_fail(
  $f$insert into public.courses (slug, title, is_free, price_cents, status)
     values ('bad-paid', 'Paid But Free', false, 0, 'published')$f$,
  'a paid course cannot have a zero price'
);

select tests.must_fail(
  $f$insert into public.orders (user_id, course_id, amount_cents, reference_code, idempotency_key)
     values ('11111111-1111-4111-8111-111111111111',
             'aaaaaaaa-0000-4000-8000-000000000002', -100, 'CI-NEG001', 'k-neg')$f$,
  'an order cannot have a negative amount'
);

rollback to savepoint s8;

-- ===========================================================================
-- 9 · Admin access
-- ===========================================================================

savepoint s9;
select tests.act_as(:'admin');

-- Scoped to this file's own fixture users, same reasoning as the course
-- counts above: the suite must pass identically against a fresh database or
-- one already carrying real signups from manual/browser testing.
select tests.ok(
  (select count(*) from public.profiles
   where id in (:'alice', :'bob', :'admin')) = 3,
  'an admin can read all (fixture) profiles'
);

select tests.ok(
  (select count(*) from public.quiz_options where id::text like 'ffffffff-%') = 2,
  'an admin CAN read the answer key'
);

select tests.ok(
  (select count(*) from public.courses where id::text like 'aaaaaaaa-%') = 3,
  'an admin can see draft fixture courses'
);

rollback to savepoint s9;

-- ===========================================================================
-- 10 · Public course outline (syllabus) function
--
-- Regression coverage for a real bug: the course detail page used to list
-- lessons straight from `public.lessons`, which RLS filters to preview-only
-- for an unenrolled visitor — so locked modules rendered completely empty
-- instead of showing what the course contains. get_course_outline_public()
-- fixes this by exposing structure (title/type/duration) without content.
-- ===========================================================================

savepoint s10;

-- Give the draft course a real module/lesson (as superuser) so the next
-- assertion actually exercises the function's status check, rather than
-- trivially returning zero rows because the course has no lessons at all.
insert into public.modules (id, course_id, title)
values ('bbbbbbbb-0000-4000-8000-000000000099',
        'aaaaaaaa-0000-4000-8000-000000000003', 'Draft Module');
insert into public.lessons (id, module_id, course_id, title, slug, type, content_mdx)
values ('cccccccc-0000-4000-8000-000000000099', 'bbbbbbbb-0000-4000-8000-000000000099',
        'aaaaaaaa-0000-4000-8000-000000000003', 'Draft Lesson', 'draft-lesson',
        'text', 'Not yet public');

select tests.act_as_anon();

select tests.ok(
  (select count(*) from public.get_course_outline_public(
    'aaaaaaaa-0000-4000-8000-000000000002')) = 2,
  'the public outline lists BOTH lessons of a paid course, preview and locked alike'
);

select tests.ok(
  (select count(*) from public.get_course_outline_public(
    'aaaaaaaa-0000-4000-8000-000000000002')
   where lesson_id = 'cccccccc-0000-4000-8000-000000000002') = 1,
  'the locked (non-preview) lesson appears in the outline by title...'
);

select tests.ok(
  not exists (
    select 1 from information_schema.routines
    where routine_name = 'get_course_outline_public'
      and routine_definition ilike '%content_mdx%'
  ),
  '...but the function never selects content_mdx, youtube_id or attachment_path'
);

select tests.ok(
  (select count(*) from public.get_course_outline_public(
    'aaaaaaaa-0000-4000-8000-000000000003')) = 0,
  'the outline of a DRAFT course is empty for anon, even though it has a real lesson'
);

rollback to savepoint s10;

-- ===========================================================================
-- 12 · create_order and submit_bank_transfer_slip
-- ===========================================================================

savepoint s12;

select tests.act_as_anon();
select tests.must_fail(
  format($f$select public.create_order('%s')$f$,
         'aaaaaaaa-0000-4000-8000-000000000002'),
  'anon cannot open an order'
);
reset role;

select tests.act_as(:'alice');

select tests.must_fail(
  format($f$select public.create_order('%s')$f$,
         'aaaaaaaa-0000-4000-8000-000000000001'),
  'cannot open an order for a FREE course'
);

select tests.must_fail(
  format($f$select public.create_order('%s')$f$,
         'aaaaaaaa-0000-4000-8000-000000000003'),
  'cannot open an order for a DRAFT course (even though it is free-flagged)'
);

select (o).id as order_id, (o).reference_code as ref, (o).amount_cents as amt, (o).status as st
from public.create_order('aaaaaaaa-0000-4000-8000-000000000002') as o \gset

select tests.ok(
  :amt = 2500000 and :'st' = 'pending' and :'ref' ~ '^CI-[A-Z0-9]{7}$',
  'create_order opens a pending order at the listed price with a well-formed reference code'
);

select tests.ok(
  (select count(*) from public.payment_events
   where order_id = :'order_id' and type = 'order_created') = 1,
  'create_order logs an order_created payment event'
);

-- Idempotency: revisiting checkout must not mint a second reference code.
select (o).id as order_id2
from public.create_order('aaaaaaaa-0000-4000-8000-000000000002') as o \gset

select tests.ok(
  :'order_id' = :'order_id2',
  'calling create_order again for the same open order returns the SAME order, not a new one'
);

select tests.ok(
  (select count(*) from public.orders
   where user_id = :'alice' and course_id = 'aaaaaaaa-0000-4000-8000-000000000002') = 1,
  'exactly one order exists — no duplicate reference codes from double-submission'
);

-- Already-enrolled students cannot open a second order for the same course.
reset role;
insert into public.enrollments (user_id, course_id, status)
values (:'bob', 'aaaaaaaa-0000-4000-8000-000000000002', 'active');
select tests.act_as(:'bob');
select tests.must_fail(
  format($f$select public.create_order('%s')$f$,
         'aaaaaaaa-0000-4000-8000-000000000002'),
  'a student already enrolled in the course cannot open another order for it'
);
reset role;

-- --- submit_bank_transfer_slip ---------------------------------------------

select tests.act_as(:'bob');
select tests.must_fail(
  format($f$select public.submit_bank_transfer_slip('%s', 'payment-slips/%s/fake.jpg')$f$,
         :'order_id', :'bob'),
  'Bob cannot submit a slip against Alice''s order'
);
reset role;

select tests.act_as(:'alice');
select public.submit_bank_transfer_slip(
  :'order_id', format('payment-slips/%s/slip1.jpg', :'alice'), 'Alice Perera', current_date, 2500000
);

select tests.ok(
  (select status from public.orders where id = :'order_id') = 'under_review',
  'submitting a slip moves the order to under_review'
);
select tests.ok(
  (select count(*) from public.bank_transfers where order_id = :'order_id') = 1,
  'exactly one bank_transfers row exists for the order'
);
select tests.ok(
  (select count(*) from public.payment_events
   where order_id = :'order_id' and type = 'slip_submitted') = 1,
  'submitting a slip logs a slip_submitted payment event'
);
reset role;

-- Reject, then prove resubmission works and clears the previous verdict.
select public.reject_order(:'order_id', :'admin', 'blurry slip');

select tests.act_as(:'alice');
select public.submit_bank_transfer_slip(
  :'order_id', format('payment-slips/%s/slip2.jpg', :'alice')
);

select tests.ok(
  (select status from public.orders where id = :'order_id') = 'under_review',
  'resubmission after rejection moves the order back to under_review'
);
select tests.ok(
  (select slip_path from public.bank_transfers where order_id = :'order_id')
    = format('payment-slips/%s/slip2.jpg', :'alice'),
  'resubmission overwrites the slip path on the SAME bank_transfers row (upsert, not a new row)'
);
select tests.ok(
  (select reviewed_by from public.bank_transfers where order_id = :'order_id') is null,
  'resubmission clears the previous rejection verdict'
);
reset role;

-- A rejected order cannot be marked paid without going through review again
-- via a fresh slip — direct status writes remain blocked throughout.
select tests.act_as(:'alice');
select tests.must_fail(
  format($f$update public.orders set status = 'paid' where id = '%s'$f$, :'order_id'),
  'a student can never move their own order straight to paid'
);
reset role;

rollback to savepoint s12;

-- ===========================================================================
-- 13 · Phone OTP verification
-- ===========================================================================

savepoint s13;

select tests.act_as_anon();
select tests.must_fail(
  $f$select public.request_phone_otp('+94771234567')$f$,
  'anon cannot request a phone OTP'
);
reset role;

select tests.act_as(:'alice');

select tests.must_fail(
  $f$select public.request_phone_otp('0771234567')$f$,
  'a phone number not in +94XXXXXXXXX format is rejected'
);

select public.request_phone_otp('+94771234567') as alice_code \gset

select tests.ok(
  :'alice_code' ~ '^[0-9]{6}$',
  'request_phone_otp returns a 6-digit code'
);
select tests.ok(
  (select phone from public.profiles where id = :'alice') = '+94771234567',
  'the phone number is recorded on the profile immediately (unverified)'
);
select tests.ok(
  (select phone_verified_at from public.profiles where id = :'alice') is null,
  'phone_verified_at stays null until the code is actually verified'
);

select tests.must_fail(
  $f$select public.request_phone_otp('+94771234567')$f$,
  'a second code cannot be requested within the 60 second cooldown'
);

-- Bob has never requested a code, so verifying finds no row of his — proves
-- one student can never consume another student's OTP session.
select tests.act_as(:'bob');
select tests.ok(
  public.verify_phone_otp(:'alice_code') = false,
  'Bob cannot verify using Alice''s code — he has no pending OTP of his own'
);
select tests.ok(
  (select phone_verified_at from public.profiles where id = :'bob') is null,
  'Bob''s profile is untouched'
);
reset role;

select tests.act_as(:'alice');

select tests.ok(
  public.verify_phone_otp('000000') = false,
  'the wrong code is rejected'
);
select tests.ok(
  (select phone_verified_at from public.profiles where id = :'alice') is null,
  'a wrong attempt does not verify the phone'
);

select tests.ok(
  public.verify_phone_otp(:'alice_code') = true,
  'the correct code verifies successfully'
);
select tests.ok(
  (select phone_verified_at from public.profiles where id = :'alice') is not null,
  'phone_verified_at is now set'
);

select tests.ok(
  public.verify_phone_otp(:'alice_code') = false,
  'a consumed code cannot be replayed'
);

select tests.must_fail(
  format($f$update public.profiles set phone_verified_at = now() where id = '%s'$f$, :'alice'),
  'phone_verified_at remains unwritable by direct update, even to the owning student'
);
reset role;

rollback to savepoint s13;

-- ===========================================================================
-- 14 · Quiz attempt flow — get_quiz_paper / start_quiz_attempt / submit_quiz_attempt
--
-- The fixture quiz (devops-quiz) has a known answer key: "docker ps" is
-- correct, "docker rm" is not. Every assertion below either proves that key
-- stays hidden until the right moment, or proves grading matches it exactly.
-- ===========================================================================

savepoint s14;

insert into public.enrollments (user_id, course_id, status)
values (:'bob', 'aaaaaaaa-0000-4000-8000-000000000002', 'active');

select tests.act_as_anon();
select tests.must_fail(
  $f$select public.get_quiz_paper('dddddddd-0000-4000-8000-000000000001')$f$,
  'anon cannot fetch a quiz paper'
);
reset role;

-- Alice is not enrolled in the course this quiz belongs to.
select tests.act_as(:'alice');
select tests.must_fail(
  $f$select public.get_quiz_paper('dddddddd-0000-4000-8000-000000000001')$f$,
  'an unenrolled student cannot fetch the paper (blocked before the key could ever leak)'
);
reset role;

select tests.act_as(:'bob');

select public.get_quiz_paper('dddddddd-0000-4000-8000-000000000001') as paper \gset

select tests.ok(
  :'paper' !~* 'is_correct' and :'paper' !~* 'explanation' and :'paper' !~* 'docker ps shows',
  'the served paper contains no is_correct flag, no explanation, and not even the explanation text'
);
select tests.ok(
  :'paper' ~ 'docker ps' and :'paper' ~ 'docker rm',
  'both options are still shown to the student — the paper just does not say which is right'
);

select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as attempt1 \gset

select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as attempt1_again \gset
select tests.ok(
  :'attempt1' = :'attempt1_again',
  'starting again before submitting resumes the SAME open attempt, not a new one'
);
reset role;

-- Alice cannot submit into Bob's attempt, even with a guessed id.
select tests.act_as(:'alice');
select tests.must_fail(
  format($f$select public.submit_quiz_attempt('%s', '{}'::jsonb)$f$, :'attempt1'),
  'Alice cannot submit an attempt that belongs to Bob'
);
reset role;

select tests.act_as(:'bob');

select public.submit_quiz_attempt(
  :'attempt1',
  jsonb_build_object('eeeeeeee-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000001')
) as result1 \gset

select tests.ok(
  (:'result1'::jsonb ->> 'score_pct')::numeric = 100
    and (:'result1'::jsonb ->> 'passed')::boolean = true,
  'answering correctly grades to 100% and passed'
);
select tests.ok(
  (select score_pct from public.quiz_attempts where id = :'attempt1') = 100
    and (select passed from public.quiz_attempts where id = :'attempt1') = true,
  'the graded result is persisted on quiz_attempts, not just returned once'
);
select tests.ok(
  (:'result1'::jsonb -> 'questions' -> 0 ->> 'correct_option_id') = 'ffffffff-0000-4000-8000-000000000001',
  'the answer key IS revealed in the post-submission result — but only now'
);

select tests.must_fail(
  format($f$select public.submit_quiz_attempt('%s', '{}'::jsonb)$f$, :'attempt1'),
  'the same attempt cannot be submitted twice'
);

-- A fresh start after submission opens attempt #2, not a resume.
select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as attempt2 \gset
select tests.ok(
  :'attempt1' <> :'attempt2'
    and (select attempt_no from public.quiz_attempts where id = :'attempt2') = 2,
  'once an attempt is submitted, starting again opens a NEW attempt (#2), not a resume'
);

select public.submit_quiz_attempt(
  :'attempt2',
  jsonb_build_object('eeeeeeee-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000002')
) as result2 \gset

select tests.ok(
  (:'result2'::jsonb ->> 'score_pct')::numeric = 0
    and (:'result2'::jsonb ->> 'passed')::boolean = false,
  'answering wrong grades to 0% and not passed'
);

select tests.ok(
  (select count(*) from public.quiz_attempt_answers where attempt_id = :'attempt1') = 1,
  'Bob can read his own graded answers after submission'
);
reset role;

select tests.act_as(:'alice');
select tests.ok(
  (select count(*) from public.quiz_attempt_answers where attempt_id = :'attempt1') = 0,
  'Alice cannot read Bob''s graded answers'
);
reset role;

-- --- get_attempt_result — reviewing a graded attempt later -----------------

select tests.act_as(:'bob');
select public.get_attempt_result(:'attempt1') as review1 \gset
select tests.ok(
  (:'review1'::jsonb ->> 'score_pct')::numeric = 100
    and (:'review1'::jsonb -> 'questions' -> 0 ->> 'explanation') is not null,
  'Bob can re-review his own graded attempt later, explanation included'
);
reset role;

select tests.act_as(:'alice');
select tests.must_fail(
  format($f$select public.get_attempt_result('%s')$f$, :'attempt1'),
  'Alice cannot review Bob''s attempt'
);
reset role;

select tests.act_as(:'admin');
select public.get_attempt_result(:'attempt1') as admin_review \gset
select tests.ok(
  (:'admin_review'::jsonb ->> 'score_pct')::numeric = 100,
  'an admin can review any attempt'
);
reset role;

select tests.act_as(:'bob');
select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as attempt3 \gset
select tests.must_fail(
  format($f$select public.get_attempt_result('%s')$f$, :'attempt3'),
  'an attempt still in progress cannot be reviewed — nothing has been graded yet'
);
-- Close it out so the max_attempts assertion below (which counts attempts,
-- not just submitted ones) has no open attempt left to silently resume.
select public.submit_quiz_attempt(:'attempt3', '{}'::jsonb);
reset role;

-- --- max_attempts is enforced --------------------------------------------

insert into public.quiz_questions (id, quiz_id, body, explanation)
values ('eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000001',
        'One-shot bonus question', null);
insert into public.quiz_options (id, question_id, body, is_correct)
values ('ffffffff-0000-4000-8000-000000000003', 'eeeeeeee-0000-4000-8000-000000000002', 'Yes', true);

update public.quizzes set max_attempts = 2 where id = 'dddddddd-0000-4000-8000-000000000001';

select tests.act_as(:'bob');
select tests.must_fail(
  $f$select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001')$f$,
  'max_attempts (2, already used) blocks a third attempt'
);
reset role;

rollback to savepoint s14;

-- ===========================================================================
-- 15 · Sessions — join_url secrecy, capacity, registration, reminders
-- ===========================================================================

savepoint s15;

-- Session 1 is seeded as 'upcoming' so the capacity trigger (which only
-- accepts registrations while a session is upcoming) allows bob's fixture
-- registration below; it is flipped to 'live' immediately afterward.
insert into public.sessions (id, slug, title, starts_at, duration_minutes, join_url, capacity, status)
values
  ('55555555-0000-4000-8000-000000000001', 'live-now', 'Live right now',
   now() - interval '10 minutes', 60, 'https://meet.example/live', null, 'upcoming'),
  ('55555555-0000-4000-8000-000000000002', 'starting-soon', 'Starting in ten minutes',
   now() + interval '10 minutes', 60, 'https://meet.example/soon', null, 'upcoming'),
  ('55555555-0000-4000-8000-000000000003', 'starting-later', 'Starting in two hours',
   now() + interval '2 hours', 60, 'https://meet.example/later', 1, 'upcoming'),
  ('55555555-0000-4000-8000-000000000004', 'cancelled-one', 'A cancelled session',
   now() + interval '3 hours', 60, 'https://meet.example/cancelled', null, 'cancelled');

insert into public.session_registrations (id, session_id, user_id)
values
  ('66666666-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001', :'bob'),
  ('66666666-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000002', :'alice');

update public.sessions set status = 'live' where id = '55555555-0000-4000-8000-000000000001';

-- --- join_url is the only column withheld from the base table -----------

select tests.act_as_anon();
select tests.ok(
  (select id from public.sessions limit 1) is not null,
  'anon can still select ordinary columns off the sessions base table (registration RLS depends on this)'
);
select tests.must_fail(
  $f$select join_url from public.sessions limit 1$f$,
  'but not join_url — permission denied at the column-grant layer, not RLS'
);
reset role;

select tests.act_as(:'bob');
select tests.must_fail(
  $f$select join_url from public.sessions where id = '55555555-0000-4000-8000-000000000001'$f$,
  'an authenticated student cannot select join_url off the base table either — '
  'the whole point of the 0015 hardening'
);
reset role;

-- --- sessions_public: no join_url column, but an accurate registered_count -

select tests.act_as_anon();
select tests.ok(
  (select registered_count from public.sessions_public
   where id = '55555555-0000-4000-8000-000000000002') = 1,
  'sessions_public reports the true registered_count, not the caller''s own-row RLS count'
);
select tests.ok(
  not exists (select 1 from public.sessions_public where id = '55555555-0000-4000-8000-000000000004'),
  'a cancelled session does not appear in the public listing'
);
reset role;

-- --- get_session_join_url: registration + time-window gating -------------

select tests.act_as(:'bob');
select tests.ok(
  public.get_session_join_url('55555555-0000-4000-8000-000000000001') = 'https://meet.example/live',
  'a registered student gets the join_url once the session is live'
);
reset role;

select tests.act_as(:'alice');
select tests.ok(
  public.get_session_join_url('55555555-0000-4000-8000-000000000002') = 'https://meet.example/soon',
  'a registered student gets the join_url within 15 minutes of the start time'
);
select tests.must_fail(
  $f$select public.get_session_join_url('55555555-0000-4000-8000-000000000001')$f$,
  'a student not registered for a session cannot get its join_url, even once it is live'
);
reset role;

select tests.act_as(:'admin');
select tests.ok(
  public.get_session_join_url('55555555-0000-4000-8000-000000000001') = 'https://meet.example/live',
  'an admin can always read a session''s join_url'
);
reset role;

-- Register alice into the two-hour-out session, then check the "too early" case.
select tests.act_as(:'alice');
insert into public.session_registrations (session_id, user_id)
values ('55555555-0000-4000-8000-000000000003', :'alice');
select tests.ok(
  public.get_session_join_url('55555555-0000-4000-8000-000000000003') is null,
  'a registered student gets null (not an error) more than 15 minutes before start'
);
reset role;

-- --- registration confirmation notice fires from the trigger --------------

select tests.act_as(:'admin');
select tests.ok(
  exists (
    select 1 from public.notifications
    where dedupe_key = 'session-register-66666666-0000-4000-8000-000000000002'
      and template = 'session_registration_confirmed'
  ),
  'registering enqueues a confirmation notification via the AFTER INSERT trigger'
);
reset role;

-- --- capacity is enforced (session 3 has capacity 1, alice already holds it)

select tests.act_as(:'bob');
select tests.must_fail(
  $f$insert into public.session_registrations (session_id, user_id)
     values ('55555555-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222')$f$,
  'a full session (capacity 1, already taken) rejects a second registration'
);
reset role;

-- --- registration is only open while the session is upcoming --------------

select tests.act_as(:'bob');
select tests.must_fail(
  $f$insert into public.session_registrations (session_id, user_id)
     values ('55555555-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$f$,
  'cannot register for a session that is already live'
);
reset role;

-- --- cancelling frees the seat for someone else ----------------------------

select tests.act_as(:'alice');
delete from public.session_registrations
  where session_id = '55555555-0000-4000-8000-000000000003' and user_id = :'alice';
reset role;

select tests.act_as(:'bob');
insert into public.session_registrations (session_id, user_id)
values ('55555555-0000-4000-8000-000000000003', :'bob');
select tests.ok(true, 'after alice cancels, bob can take the now-free seat');
reset role;

-- --- attendance is staff-only, even for the registration's own owner ------

-- No UPDATE policy exists for a student on this table at all, so this isn't
-- a case that raises — RLS just matches zero rows (see grants.sql's note on
-- why that "silent no-op" shape is accepted for policies, not grants).
select tests.act_as(:'bob');
update public.session_registrations set attended = true
  where session_id = '55555555-0000-4000-8000-000000000003' and user_id = '22222222-2222-4222-8222-222222222222';
reset role;

select tests.act_as(:'admin');
select tests.ok(
  (select attended from public.session_registrations
   where session_id = '55555555-0000-4000-8000-000000000003' and user_id = '22222222-2222-4222-8222-222222222222') = false,
  'a student cannot mark their own attendance — the update above silently matched zero rows'
);
reset role;

select tests.act_as(:'admin');
update public.session_registrations set attended = true
  where session_id = '55555555-0000-4000-8000-000000000003' and user_id = :'bob';
select tests.ok(
  (select attended_marked_at from public.session_registrations
   where session_id = '55555555-0000-4000-8000-000000000003' and user_id = :'bob') is not null,
  'an admin marking attendance stamps attended_marked_at'
);
reset role;

-- --- the reminder worker is service_role-only ------------------------------

select tests.act_as(:'admin');
select tests.must_fail(
  $f$select public.enqueue_session_reminders()$f$,
  'even an admin cannot call enqueue_session_reminders() directly — service_role only'
);
reset role;

rollback to savepoint s15;

-- ===========================================================================
-- 16 · Gamification — XP wiring, streak hardening, badges
-- ===========================================================================

savepoint s16;

-- --- activity_date can no longer be asserted by the client ----------------

select tests.act_as(:'bob');
select tests.must_fail(
  format($f$insert into public.user_activity_days (user_id, activity_date)
             values (%L, current_date + 10)$f$, :'bob'),
  'a student cannot fabricate an activity day directly any more (0016 dropped that policy)'
);
reset role;

-- --- lesson completion -> XP, idempotent on re-upsert ----------------------

insert into public.enrollments (user_id, course_id, status)
values (:'bob', 'aaaaaaaa-0000-4000-8000-000000000001', 'active');

select tests.act_as(:'bob');
insert into public.lesson_progress (user_id, lesson_id, course_id, completed_at)
values (:'bob', 'cccccccc-0000-4000-8000-000000000003',
        'aaaaaaaa-0000-4000-8000-000000000001', now())
on conflict (user_id, lesson_id) do update set completed_at = excluded.completed_at;
reset role;

select tests.ok(
  (select points from public.xp_events
   where user_id = :'bob' and source = 'lesson.completed'
     and source_id = 'cccccccc-0000-4000-8000-000000000003') = 10,
  'finishing a lesson awards 10 XP'
);

-- Re-upserting the same completed lesson (the app's own upsert-on-conflict
-- pattern) must not pay out a second time.
select tests.act_as(:'bob');
insert into public.lesson_progress (user_id, lesson_id, course_id, completed_at)
values (:'bob', 'cccccccc-0000-4000-8000-000000000003',
        'aaaaaaaa-0000-4000-8000-000000000001', now())
on conflict (user_id, lesson_id) do update set completed_at = excluded.completed_at;
reset role;

select tests.ok(
  (select count(*) from public.xp_events
   where user_id = :'bob' and source = 'lesson.completed'
     and source_id = 'cccccccc-0000-4000-8000-000000000003') = 1,
  'completing an already-completed lesson again does not double-pay XP'
);

-- --- course completion -> XP and the graduate badge, once -----------------

select tests.act_as(:'bob');
select public.recompute_enrollment_progress('aaaaaaaa-0000-4000-8000-000000000001');
reset role;

select tests.ok(
  (select points from public.xp_events
   where user_id = :'bob' and source = 'course.completed'
     and source_id = 'aaaaaaaa-0000-4000-8000-000000000001') = 50,
  'completing a course (100% of its lessons) awards 50 XP'
);
select tests.ok(
  exists (
    select 1 from public.user_badges ub
    join public.badges b on b.id = ub.badge_id
    where ub.user_id = :'bob' and b.slug = 'first-course-complete'
  ),
  'first course completion awards the Course Graduate badge'
);

-- Recomputing again (e.g. a page reload re-posting the same lesson) must not
-- re-award XP or re-award the badge.
select tests.act_as(:'bob');
select public.recompute_enrollment_progress('aaaaaaaa-0000-4000-8000-000000000001');
reset role;

select tests.ok(
  (select count(*) from public.xp_events
   where user_id = :'bob' and source = 'course.completed') = 1,
  'recomputing an already-completed course again does not double-pay XP'
);
select tests.ok(
  (select count(*) from public.user_badges ub
   join public.badges b on b.id = ub.badge_id
   where ub.user_id = :'bob' and b.slug = 'first-course-complete') = 1,
  'recomputing an already-completed course again does not re-award the badge'
);

-- --- quiz pass -> XP, once per quiz across retakes -------------------------

insert into public.enrollments (user_id, course_id, status)
values (:'bob', 'aaaaaaaa-0000-4000-8000-000000000002', 'active');

select tests.act_as(:'bob');
select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as g_attempt1 \gset
select public.submit_quiz_attempt(
  :'g_attempt1',
  jsonb_build_object('eeeeeeee-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000001')
);
reset role;

select tests.ok(
  (select points from public.xp_events
   where user_id = :'bob' and source = 'quiz.passed'
     and source_id = 'dddddddd-0000-4000-8000-000000000001') = 20,
  'passing a quiz awards 20 XP'
);

select tests.act_as(:'bob');
select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as g_attempt2 \gset
select public.submit_quiz_attempt(
  :'g_attempt2',
  jsonb_build_object('eeeeeeee-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000001')
);
reset role;

select tests.ok(
  (select count(*) from public.xp_events
   where user_id = :'bob' and source = 'quiz.passed'
     and source_id = 'dddddddd-0000-4000-8000-000000000001') = 1,
  'passing the same quiz again on a retake does not double-pay XP'
);

-- --- session attendance -> XP, only on a genuine false -> true flip -------

insert into public.sessions (id, slug, title, starts_at, duration_minutes, status)
values ('77777777-0000-4000-8000-000000000001', 'gamification-test-session',
        'Gamification test session', now() - interval '10 minutes', 60, 'upcoming');

select tests.act_as(:'bob');
insert into public.session_registrations (id, session_id, user_id)
values ('88888888-0000-4000-8000-000000000001',
        '77777777-0000-4000-8000-000000000001', :'bob');
reset role;

update public.sessions set status = 'live'
where id = '77777777-0000-4000-8000-000000000001';

select tests.act_as(:'admin');
update public.session_registrations set attended = true
  where id = '88888888-0000-4000-8000-000000000001';
reset role;

select tests.ok(
  (select points from public.xp_events
   where user_id = :'bob' and source = 'session.attended'
     and source_id = '77777777-0000-4000-8000-000000000001') = 15,
  'staff marking attendance awards 15 XP'
);

-- Toggle off then on again — a correction, not a second attendance.
select tests.act_as(:'admin');
update public.session_registrations set attended = false
  where id = '88888888-0000-4000-8000-000000000001';
update public.session_registrations set attended = true
  where id = '88888888-0000-4000-8000-000000000001';
reset role;

select tests.ok(
  (select count(*) from public.xp_events
   where user_id = :'bob' and source = 'session.attended'
     and source_id = '77777777-0000-4000-8000-000000000001') = 1,
  'toggling attendance off and back on does not double-pay XP'
);

-- --- streak badge fires once six prior days plus today reach seven --------

insert into public.user_activity_days (user_id, activity_date)
select :'bob', ((now() at time zone 'Asia/Colombo')::date - g)
from generate_series(1, 6) as g;

select tests.ok(
  not exists (
    select 1 from public.user_badges ub
    join public.badges b on b.id = ub.badge_id
    where ub.user_id = :'bob' and b.slug = 'streak-7'
  ),
  'six days of backfilled activity alone does not yet award the 7-day streak badge'
);

-- The badge check only runs inside record_activity(), which only runs from
-- an actual XP-earning action — not merely because a row now exists in
-- user_activity_days. Trigger one more (a fresh quiz attempt) so today's
-- streak recalculation actually happens with the backfilled days in place.
select tests.act_as(:'bob');
select public.start_quiz_attempt('dddddddd-0000-4000-8000-000000000001') as g_attempt3 \gset
select public.submit_quiz_attempt(
  :'g_attempt3',
  jsonb_build_object('eeeeeeee-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000001')
);
reset role;

select tests.ok(
  exists (
    select 1 from public.user_badges ub
    join public.badges b on b.id = ub.badge_id
    where ub.user_id = :'bob' and b.slug = 'streak-7'
  ),
  'seven consecutive active days (six backfilled + today) awards the streak badge'
);

-- --- leaderboard: opt-in only, and it's the true global total -------------

update public.profiles set leaderboard_opt_in = true where id = :'bob';
update public.profiles set leaderboard_opt_in = false where id = :'alice';

select tests.act_as_anon();
select tests.ok(
  exists (select 1 from public.leaderboard_all_time where user_id = :'bob'),
  'an opted-in student appears on the public leaderboard'
);
select tests.ok(
  not exists (select 1 from public.leaderboard_all_time where user_id = :'alice'),
  'a student who has not opted in is excluded from the leaderboard entirely'
);
reset role;

rollback to savepoint s16;

-- ===========================================================================
-- 17 · Site content (partners, highlights, founder profile)
-- ===========================================================================

savepoint s17;

insert into public.partners (id, name, logo_url, sort_order) values
  ('dddddddd-0000-4000-8000-000000000001', 'Test Partner',
   'https://res.cloudinary.com/dopkcplb3/image/upload/test.png', 0);

insert into public.highlights (id, src, alt, sort_order) values
  ('eeeeeeee-0000-4000-8000-000000000001',
   'https://res.cloudinary.com/dopkcplb3/image/upload/test.jpg', 'Test photo', 0);

insert into public.founder_education (id, period, institution, detail, sort_order) values
  ('ffffffff-0000-4000-8000-000000000001', '2020', 'Test University', 'Test degree', 0);

insert into public.founder_experience (id, period, role_title, org, sort_order) values
  ('11111111-0000-4000-8000-000000000001', '2020', 'Test Role', 'Test Org', 0);

insert into public.founder_certifications (id, label, sort_order) values
  ('22222222-0000-4000-8000-000000000001', 'Test Certification', 0);

select tests.act_as_anon();

select tests.ok(
  (select count(*) from public.partners where id::text like 'dddddddd-%') = 1,
  'anon reads partners'
);
select tests.ok(
  (select count(*) from public.highlights where id::text like 'eeeeeeee-%') = 1,
  'anon reads highlights'
);
select tests.ok(
  (select name from public.founder_profile where id = 1) = 'Tharindu Kalhara',
  'anon reads the founder profile singleton'
);
select tests.ok(
  (select count(*) from public.founder_education where id::text like 'ffffffff-%') = 1,
  'anon reads founder education entries'
);
select tests.ok(
  (select count(*) from public.founder_experience where id::text like '11111111-%') = 1,
  'anon reads founder experience entries'
);
select tests.ok(
  (select count(*) from public.founder_certifications where id::text like '22222222-%') = 1,
  'anon reads founder certifications'
);

select tests.must_fail(
  $$insert into public.partners (name, logo_url)
    values ('Rogue Partner', 'https://res.cloudinary.com/dopkcplb3/image/upload/x.png')$$,
  'anon cannot insert a partner'
);
select tests.must_fail(
  $$update public.founder_profile set name = 'Hijacked' where id = 1$$,
  'anon cannot update the founder profile'
);

select tests.act_as(:'alice');

select tests.must_fail(
  $$insert into public.highlights (src, alt)
    values ('https://res.cloudinary.com/dopkcplb3/image/upload/x.jpg', 'x')$$,
  'a student cannot insert a highlight'
);
-- UPDATE and DELETE are USING-clause filtered, not WITH CHECK-rejected, so a
-- blocked one of these isn't a raised error - it's RLS silently matching zero
-- rows, same shape as the session_registrations attendance case further up
-- this file. INSERT above raises because it's WITH CHECK that fails it.
update public.founder_profile set name = 'Hijacked' where id = 1;
delete from public.founder_certifications
  where id = '22222222-0000-4000-8000-000000000001';

select tests.act_as(:'admin');

select tests.ok(
  (select name from public.founder_profile where id = 1) <> 'Hijacked',
  'a student cannot update the founder profile - the update above silently matched zero rows'
);
select tests.ok(
  (select count(*) from public.founder_certifications
   where id = '22222222-0000-4000-8000-000000000001') = 1,
  'a student cannot delete a founder certification - the delete above silently matched zero rows'
);

update public.partners set name = 'Renamed Partner'
  where id = 'dddddddd-0000-4000-8000-000000000001';
select tests.ok(
  (select name from public.partners where id = 'dddddddd-0000-4000-8000-000000000001')
    = 'Renamed Partner',
  'an admin can update a partner'
);

update public.founder_profile set name = 'Admin Edited' where id = 1;
select tests.ok(
  (select name from public.founder_profile where id = 1) = 'Admin Edited',
  'an admin can update the founder profile'
);

delete from public.founder_certifications
  where id = '22222222-0000-4000-8000-000000000001';
select tests.ok(
  (select count(*) from public.founder_certifications
   where id = '22222222-0000-4000-8000-000000000001') = 0,
  'an admin can delete a founder certification'
);

reset role;

rollback to savepoint s17;

-- ===========================================================================
-- 11 · Every public table has RLS enabled
--
-- Guards against the most likely future mistake: adding a table and
-- forgetting the `alter table ... enable row level security` line.
-- ===========================================================================

do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ')
  into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity;

  if v_missing is not null then
    raise exception 'FAIL  tables in public without RLS enabled: %', v_missing;
  end if;
  raise notice '  PASS  every table in public has RLS enabled';
end $$;

rollback;
