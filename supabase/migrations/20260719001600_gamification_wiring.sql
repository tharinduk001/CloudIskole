-- ===========================================================================
-- 0016 · Wiring XP, streaks, badges and certificates into the actual actions
-- that earn them
--
-- 0007_gamification.sql shipped the ledger, the leaderboard views, badges and
-- certificates, but nothing ever called award_xp() — every action that
-- should earn XP (finishing a lesson, passing a quiz, attending a session,
-- completing a course) already runs through a SECURITY DEFINER function or
-- trigger of its own, so this hooks the award directly into those instead of
-- adding a second, easy-to-forget code path in the application layer.
--
-- It also closes a real gap in 0007: "user_activity_days: record own" let an
-- authenticated student INSERT *any* activity_date directly — nothing tied
-- it to today, or to anything actually happening. A few crafted requests
-- would fabricate an arbitrary streak. Streaks are low-stakes compared to
-- money or quiz answer keys, but there is no reason to leave an obvious
-- self-serve cheat sitting there once the feature is real: activity is now
-- recorded exclusively by record_activity() below, driven by genuine XP
-- events, and the client-writable policy is dropped.
-- ===========================================================================

drop policy "user_activity_days: record own" on public.user_activity_days;

-- ---------------------------------------------------------------------------
-- record_activity — today's Colombo date, plus any streak badge it unlocks.
-- Not exposed to authenticated/anon: only called from within the other
-- SECURITY DEFINER functions below, which already run as the table owner.
-- ---------------------------------------------------------------------------

create or replace function public.record_activity(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_streak integer;
begin
  insert into public.user_activity_days (user_id, activity_date)
  values (p_user_id, (now() at time zone 'Asia/Colombo')::date)
  on conflict do nothing;

  v_streak := public.current_streak(p_user_id);

  if v_streak >= 7 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'streak-7'
    on conflict do nothing;
  end if;

  if v_streak >= 30 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'streak-30'
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.record_activity(uuid) from public;

-- ---------------------------------------------------------------------------
-- Lesson completion — award_xp is idempotent per (user, 'lesson.completed',
-- lesson_id), so a re-upsert of an already-completed lesson (the app's own
-- upsert-on-conflict pattern) never double-pays.
-- ---------------------------------------------------------------------------

create or replace function public.tg_award_lesson_xp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.completed_at is not null and (tg_op = 'INSERT' or old.completed_at is null) then
    perform public.award_xp(new.user_id, 'lesson.completed', new.lesson_id, 10);
    perform public.record_activity(new.user_id);
  end if;
  return new;
end;
$$;

create trigger lesson_progress_award_xp
  after insert or update on public.lesson_progress
  for each row execute function public.tg_award_lesson_xp();

-- ---------------------------------------------------------------------------
-- Quiz pass — awarding on quiz_id (not attempt_id) means only the FIRST pass
-- of a given quiz ever pays out, even across retakes; that matches "you
-- learned this" rather than "you clicked submit N times."
-- ---------------------------------------------------------------------------

create or replace function public.submit_quiz_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.quiz_attempts;
  v_quiz public.quizzes;
  v_uid uuid := (select auth.uid());
  v_score integer := 0;
  v_total integer := 0;
  v_pct numeric(5, 2);
  v_passed boolean;
begin
  select * into v_attempt from public.quiz_attempts where id = p_attempt_id for update;

  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.user_id <> v_uid then
    raise exception 'This is not your attempt' using errcode = '42501';
  end if;
  if v_attempt.submitted_at is not null then
    raise exception 'This attempt was already submitted' using errcode = '22023';
  end if;

  select * into v_quiz from public.quizzes where id = v_attempt.quiz_id;

  -- Server-side clock is authoritative. A late submission is graded on what
  -- was answered, not rejected outright — the student keeps earned marks.
  if v_attempt.expires_at is not null and now() > v_attempt.expires_at then
    p_answers := '{}'::jsonb;
  end if;

  -- Record each answer with its correctness, resolved here against the key.
  insert into public.quiz_attempt_answers (attempt_id, question_id, option_id, is_correct, points_awarded)
  select
    p_attempt_id,
    qq.id,
    sel.option_id,
    coalesce(o.is_correct, false),
    case when coalesce(o.is_correct, false) then qq.points else 0 end
  from public.quiz_questions qq
  left join lateral (
    select (p_answers ->> qq.id::text)::uuid as option_id
  ) sel on true
  left join public.quiz_options o
    on o.id = sel.option_id and o.question_id = qq.id
  where qq.quiz_id = v_attempt.quiz_id
  on conflict (attempt_id, question_id) do nothing;

  select coalesce(sum(points_awarded), 0) into v_score
  from public.quiz_attempt_answers where attempt_id = p_attempt_id;

  select coalesce(sum(points), 0) into v_total
  from public.quiz_questions where quiz_id = v_attempt.quiz_id;

  v_pct := case when v_total = 0 then 0 else round((v_score::numeric / v_total) * 100, 2) end;
  v_passed := v_pct >= v_quiz.pass_mark_pct;

  update public.quiz_attempts
  set submitted_at = now(),
      score_points = v_score,
      total_points = v_total,
      score_pct = v_pct,
      passed = v_passed
  where id = p_attempt_id;

  if v_passed then
    perform public.award_xp(v_uid, 'quiz.passed', v_attempt.quiz_id, 20);
    perform public.record_activity(v_uid);
  end if;

  -- Only now, after submission, is the key revealed — together with the
  -- explanations, so the quiz teaches rather than just scores.
  return jsonb_build_object(
    'score_points', v_score,
    'total_points', v_total,
    'score_pct', v_pct,
    'passed', v_passed,
    'pass_mark_pct', v_quiz.pass_mark_pct,
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', qq.id,
        'body', qq.body,
        'explanation', qq.explanation,
        'chosen_option_id', a.option_id,
        'correct_option_id', (
          select o2.id from public.quiz_options o2
          where o2.question_id = qq.id and o2.is_correct limit 1
        ),
        'is_correct', a.is_correct
      ) order by qq.sort_order), '[]'::jsonb)
      from public.quiz_questions qq
      left join public.quiz_attempt_answers a
        on a.question_id = qq.id and a.attempt_id = p_attempt_id
      where qq.quiz_id = v_attempt.quiz_id
    )
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Session attendance — only when staff flip attended false -> true, never on
-- the reverse (correcting a mis-mark should not claw back XP a student
-- earned in good faith; it's not worth the complexity for gamification XP).
-- ---------------------------------------------------------------------------

create or replace function public.tg_protect_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.attended is distinct from old.attended and not public.is_admin() then
    raise exception 'Only staff may mark attendance' using errcode = '42501';
  end if;
  if new.attended is distinct from old.attended then
    new.attended_marked_at := now();
  end if;
  if new.attended = true and old.attended = false then
    perform public.award_xp(new.user_id, 'session.attended', new.session_id, 15);
    perform public.record_activity(new.user_id);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Course completion — XP, a badge, and the certificate itself, all in the one
-- transaction that discovers the course is actually finished. This is why
-- certificates has no student INSERT policy at all: a certificate always
-- comes from here, never from a hand-crafted request.
-- ---------------------------------------------------------------------------

create or replace function public.recompute_enrollment_progress(
  p_course_id uuid,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(p_user_id, (select auth.uid()));
  v_total integer;
  v_completed integer;
  v_pct integer;
  v_is_complete boolean;
  v_was_complete boolean;
  v_code text;
  v_had_certificate boolean;
begin
  -- A student may only recompute their own progress. Admin/service-role calls
  -- (e.g. an admin manually adjusting a roster) may target any user.
  if v_user_id <> (select auth.uid()) and not public.is_admin() then
    raise exception 'You may only update your own progress' using errcode = '42501';
  end if;

  select count(*) into v_total
  from public.lessons
  where course_id = p_course_id;

  select count(*) into v_completed
  from public.lesson_progress
  where course_id = p_course_id
    and user_id = v_user_id
    and completed_at is not null;

  v_pct := case when v_total = 0 then 0 else round((v_completed::numeric / v_total) * 100) end;
  v_is_complete := v_total > 0 and v_completed >= v_total;

  select (status = 'completed') into v_was_complete
  from public.enrollments
  where course_id = p_course_id and user_id = v_user_id;

  perform set_config('app.trusted_write', 'on', true);

  update public.enrollments
  set progress_pct = v_pct,
      status = case when v_is_complete then 'completed' else status end,
      completed_at = case when v_is_complete then now() else completed_at end
  where course_id = p_course_id
    and user_id = v_user_id
    -- Never resurrect a revoked enrollment (e.g. a refunded course) just
    -- because a stale client re-posts a completed lesson.
    and status in ('active', 'completed');

  perform set_config('app.trusted_write', 'off', true);

  if v_is_complete and not coalesce(v_was_complete, false) then
    perform public.award_xp(v_user_id, 'course.completed', p_course_id, 50);
    perform public.record_activity(v_user_id);

    select exists(select 1 from public.certificates where user_id = v_user_id) into v_had_certificate;

    loop
      v_code := 'CI-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 4))
                || '-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 4));
      exit when not exists (select 1 from public.certificates where code = v_code);
    end loop;

    insert into public.certificates (user_id, course_id, code)
    values (v_user_id, p_course_id, v_code)
    on conflict (user_id, course_id) do nothing;

    if not v_had_certificate then
      insert into public.user_badges (user_id, badge_id)
      select v_user_id, b.id from public.badges b where b.slug = 'first-course-complete'
      on conflict do nothing;
    end if;
  end if;
end;
$$;

revoke all on function public.recompute_enrollment_progress(uuid, uuid) from public;
grant execute on function public.recompute_enrollment_progress(uuid, uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Seed the three badges the triggers above already know how to award, so
-- the feature works out of the box. Admin can add more from /admin/badges.
-- ---------------------------------------------------------------------------

insert into public.badges (slug, name, description, icon) values
  ('first-course-complete', 'Course Graduate', 'Completed your first CloudIskole course.', '🎓'),
  ('streak-7', '7-Day Streak', 'Active on CloudIskole seven days in a row.', '🔥'),
  ('streak-30', '30-Day Streak', 'Active on CloudIskole thirty days in a row.', '⚡')
on conflict (slug) do nothing;
