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
values ('bbbbbbbb-0000-4000-8000-000000000001',
        'aaaaaaaa-0000-4000-8000-000000000002', 'Module 1');

insert into public.lessons (id, module_id, course_id, title, slug, type, content_mdx, is_preview)
values
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

select tests.ok(
  (select count(*) from public.courses) = 2,
  'anon sees only the 2 published courses, not the draft'
);

select tests.ok(
  (select count(*) from public.courses
   where slug = 'secret-draft') = 0,
  'anon cannot read a draft course'
);

select tests.ok(
  (select count(*) from public.lessons) = 1,
  'anon sees only the preview lesson, not the paid one'
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
   where action = 'enrollment.granted') = 1,
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

select tests.ok(
  (select count(*) from public.profiles) = 3,
  'an admin can read all profiles'
);

select tests.ok(
  (select count(*) from public.quiz_options) = 2,
  'an admin CAN read the answer key'
);

select tests.ok(
  (select count(*) from public.courses) = 3,
  'an admin can see draft courses'
);

rollback to savepoint s9;

-- ===========================================================================
-- 10 · Every public table has RLS enabled
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
