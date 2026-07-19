-- ===========================================================================
-- 0005 · Quizzes, questions, options and attempts
--
-- The central security property of this file: a student can never read
-- `quiz_options.is_correct`, by any query, with any valid token.
--
-- This is NOT achieved by omitting the column from a SELECT in application
-- code — Supabase exposes PostgREST, so the client can ask for any column it
-- likes. It is achieved by giving students no SELECT policy on the options
-- table at all, and serving the paper through a SECURITY DEFINER function that
-- constructs the response without the key.
-- ===========================================================================

create table public.quizzes (
  id uuid primary key default extensions.gen_random_uuid(),

  scope public.quiz_scope not null,
  -- Set for lesson/course scope; null for standalone exams.
  course_id uuid references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,

  slug text not null unique,
  title text not null,
  description text,

  time_limit_minutes integer,
  pass_mark_pct smallint not null default 60,
  max_attempts smallint,
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,

  available_from timestamptz,
  available_until timestamptz,
  status public.content_status not null default 'draft',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quizzes_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint quizzes_pass_mark_range check (pass_mark_pct between 0 and 100),
  constraint quizzes_time_limit_positive check (
    time_limit_minutes is null or time_limit_minutes > 0
  ),
  constraint quizzes_max_attempts_positive check (
    max_attempts is null or max_attempts > 0
  ),
  constraint quizzes_window_ordered check (
    available_from is null or available_until is null
      or available_until > available_from
  ),
  -- Scope determines which parent must be present.
  constraint quizzes_scope_parent check (
    (scope = 'lesson' and lesson_id is not null and course_id is not null)
    or (scope = 'course' and course_id is not null and lesson_id is null)
    or (scope = 'exam' and lesson_id is null)
  )
);

create index quizzes_course_idx on public.quizzes (course_id) where status = 'published';
create index quizzes_exam_idx on public.quizzes (status, available_from) where scope = 'exam';

create trigger quizzes_touch_updated_at
  before update on public.quizzes
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.quiz_questions (
  id uuid primary key default extensions.gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,

  body text not null,
  -- Shown only after the attempt is submitted.
  explanation text,
  points smallint not null default 1,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quiz_questions_points_positive check (points > 0)
);

create index quiz_questions_quiz_idx on public.quiz_questions (quiz_id, sort_order);

create trigger quiz_questions_touch_updated_at
  before update on public.quiz_questions
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- quiz_options — CONTAINS THE ANSWER KEY
-- ---------------------------------------------------------------------------

create table public.quiz_options (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,

  body text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0
);

create index quiz_options_question_idx on public.quiz_options (question_id, sort_order);

comment on column public.quiz_options.is_correct is
  'ANSWER KEY. Students have no SELECT policy on this table. Serve papers via get_quiz_paper().';

-- ---------------------------------------------------------------------------

create table public.quiz_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  attempt_no smallint not null default 1,

  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  -- Deadline computed at start from the quiz time limit. Enforced server-side
  -- at submission, so a tampered client clock cannot buy extra time.
  expires_at timestamptz,

  score_points integer,
  total_points integer,
  score_pct numeric(5, 2),
  passed boolean,

  unique (quiz_id, user_id, attempt_no),
  constraint quiz_attempts_score_range check (
    score_pct is null or score_pct between 0 and 100
  ),
  -- A submitted attempt must be fully graded; an open one must be ungraded.
  constraint quiz_attempts_graded_together check (
    (submitted_at is null and score_points is null and passed is null)
    or (submitted_at is not null and score_points is not null and passed is not null)
  )
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id, submitted_at desc);
create index quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id, score_pct desc)
  where submitted_at is not null;

-- ---------------------------------------------------------------------------

create table public.quiz_attempt_answers (
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  option_id uuid references public.quiz_options (id) on delete set null,

  -- Graded server-side at submission. Never sent by the client.
  is_correct boolean,
  points_awarded smallint not null default 0,

  primary key (attempt_id, question_id)
);

-- ===========================================================================
-- get_quiz_paper — serves a quiz WITHOUT the answer key
-- ===========================================================================

create or replace function public.get_quiz_paper(p_quiz_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_quiz public.quizzes;
  v_result jsonb;
begin
  select * into v_quiz from public.quizzes where id = p_quiz_id;

  if not found or v_quiz.status <> 'published' then
    raise exception 'Quiz not available' using errcode = 'P0002';
  end if;

  -- Availability window.
  if v_quiz.available_from is not null and now() < v_quiz.available_from then
    raise exception 'Quiz has not opened yet' using errcode = '22023';
  end if;
  if v_quiz.available_until is not null and now() > v_quiz.available_until then
    raise exception 'Quiz has closed' using errcode = '22023';
  end if;

  -- Course-linked quizzes require enrollment. Standalone exams are open to
  -- any signed-in student.
  if v_quiz.course_id is not null and not public.is_enrolled(v_quiz.course_id) then
    raise exception 'You are not enrolled in this course' using errcode = '42501';
  end if;

  if (select auth.uid()) is null then
    raise exception 'Sign in to take this quiz' using errcode = '42501';
  end if;

  -- Note the projection: `body` and `id` only. `is_correct` and `explanation`
  -- are never placed into this payload.
  select jsonb_build_object(
    'quiz', jsonb_build_object(
      'id', v_quiz.id,
      'title', v_quiz.title,
      'description', v_quiz.description,
      'time_limit_minutes', v_quiz.time_limit_minutes,
      'pass_mark_pct', v_quiz.pass_mark_pct
    ),
    'questions', coalesce(jsonb_agg(q.question order by q.ord), '[]'::jsonb)
  )
  into v_result
  from (
    select
      case
        when v_quiz.shuffle_questions then row_number() over (order by random())
        else qq.sort_order
      end as ord,
      jsonb_build_object(
        'id', qq.id,
        'body', qq.body,
        'points', qq.points,
        'options', (
          select coalesce(jsonb_agg(
            jsonb_build_object('id', o.id, 'body', o.body)
            order by case when v_quiz.shuffle_options then random() else o.sort_order end
          ), '[]'::jsonb)
          from public.quiz_options o
          where o.question_id = qq.id
        )
      ) as question
    from public.quiz_questions qq
    where qq.quiz_id = p_quiz_id
  ) q;

  return v_result;
end;
$$;

revoke all on function public.get_quiz_paper(uuid) from public;
grant execute on function public.get_quiz_paper(uuid) to authenticated;

-- ===========================================================================
-- start_quiz_attempt — opens an attempt and fixes its deadline server-side
-- ===========================================================================

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quiz public.quizzes;
  v_uid uuid := (select auth.uid());
  v_used smallint;
  v_open uuid;
  v_attempt_id uuid;
begin
  if v_uid is null then
    raise exception 'Sign in to take this quiz' using errcode = '42501';
  end if;

  select * into v_quiz from public.quizzes where id = p_quiz_id;
  if not found or v_quiz.status <> 'published' then
    raise exception 'Quiz not available' using errcode = 'P0002';
  end if;

  if v_quiz.course_id is not null and not public.is_enrolled(v_quiz.course_id) then
    raise exception 'You are not enrolled in this course' using errcode = '42501';
  end if;

  -- Resume an attempt that is still open rather than starting a new one, so a
  -- page refresh does not consume another of the student's attempts.
  select id into v_open
  from public.quiz_attempts
  where quiz_id = p_quiz_id and user_id = v_uid and submitted_at is null
    and (expires_at is null or expires_at > now())
  order by started_at desc
  limit 1;

  if v_open is not null then
    return v_open;
  end if;

  select coalesce(max(attempt_no), 0) into v_used
  from public.quiz_attempts
  where quiz_id = p_quiz_id and user_id = v_uid;

  if v_quiz.max_attempts is not null and v_used >= v_quiz.max_attempts then
    raise exception 'You have used all % attempts for this quiz', v_quiz.max_attempts
      using errcode = '22023';
  end if;

  insert into public.quiz_attempts (quiz_id, user_id, attempt_no, expires_at)
  values (
    p_quiz_id,
    v_uid,
    v_used + 1,
    case
      when v_quiz.time_limit_minutes is null then null
      else now() + make_interval(mins => v_quiz.time_limit_minutes)
    end
  )
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke all on function public.start_quiz_attempt(uuid) from public;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;

-- ===========================================================================
-- submit_quiz_attempt — grades server-side and returns the result
--
-- The client sends only {question_id: option_id}. It never sends a score, and
-- it has never been told which option was right.
-- ===========================================================================

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

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

-- --- quizzes: metadata is listable so students can find exams --------------

create policy "quizzes: read published"
  on public.quizzes for select
  to authenticated
  using (
    status = 'published'
    and (course_id is null or public.is_enrolled(course_id))
  );

create policy "quizzes: admin full access"
  on public.quizzes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- quiz_questions: admin only --------------------------------------------
-- Students receive questions exclusively through get_quiz_paper(), never by
-- reading this table. That keeps `explanation` hidden until after submission.

create policy "quiz_questions: admin full access"
  on public.quiz_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- quiz_options: ADMIN ONLY. THE ANSWER KEY LIVES HERE -------------------
-- There is deliberately no student-readable policy on this table, in any form.
-- RLS is deny-by-default, so this single admin policy is the whole access
-- surface. Adding a student SELECT policy here would leak every answer.

create policy "quiz_options: admin full access"
  on public.quiz_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- attempts ---------------------------------------------------------------
-- Read-only for students: attempts are created and graded by the SECURITY
-- DEFINER functions above, so there is no INSERT or UPDATE policy.

create policy "quiz_attempts: read own"
  on public.quiz_attempts for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "quiz_attempts: admin reads all"
  on public.quiz_attempts for select
  to authenticated
  using (public.is_admin());

create policy "quiz_attempt_answers: read own"
  on public.quiz_attempt_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = quiz_attempt_answers.attempt_id
        and a.user_id = (select auth.uid())
        -- Only after submission: otherwise a student could poll their own
        -- graded rows mid-attempt and learn the answers early.
        and a.submitted_at is not null
    )
  );

create policy "quiz_attempt_answers: admin reads all"
  on public.quiz_attempt_answers for select
  to authenticated
  using (public.is_admin());
