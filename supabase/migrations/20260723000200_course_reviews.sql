-- ===========================================================================
-- 0020 · Course intro video + ratings & reviews
--
-- Idempotent: every statement checks for prior existence first, so this is
-- safe to re-run if an earlier attempt landed partway through.
-- ===========================================================================

alter table public.courses add column if not exists intro_video_youtube_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_intro_video_format'
  ) then
    alter table public.courses add constraint courses_intro_video_format
      check (intro_video_youtube_id is null or intro_video_youtube_id ~ '^[A-Za-z0-9_-]{11}$');
  end if;
end $$;

-- ---------------------------------------------------------------------------

create table if not exists public.course_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  rating smallint not null,
  body text,

  -- Reviews are submit-once from the student's side (no edit policy below) —
  -- "approved" is the only state a moderator needs beyond the default, since
  -- rejection is just deletion.
  status text not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references public.profiles (id),

  -- One review per student per course.
  unique (course_id, user_id),
  constraint course_reviews_rating_range check (rating between 1 and 5),
  constraint course_reviews_status_valid check (status in ('pending', 'approved')),
  constraint course_reviews_body_length check (body is null or char_length(body) <= 2000)
);

create index if not exists course_reviews_course_idx on public.course_reviews (course_id, status);

drop trigger if exists course_reviews_touch_updated_at on public.course_reviews;
create trigger course_reviews_touch_updated_at
  before update on public.course_reviews
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.course_reviews enable row level security;

-- RLS restricts rows, not table access at all — anon needs the GRANT layer
-- opened too (see 20260719001000_grants.sql's own comment on this).
grant select on public.course_reviews to anon;

drop policy if exists "course_reviews: anyone reads approved" on public.course_reviews;
create policy "course_reviews: anyone reads approved"
  on public.course_reviews for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "course_reviews: read own" on public.course_reviews;
create policy "course_reviews: read own"
  on public.course_reviews for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No update policy for students: submit-once, per product decision. Editing
-- (or self-approving) a review is possible only through the admin policy
-- below.
drop policy if exists "course_reviews: enrolled students submit once" on public.course_reviews;
create policy "course_reviews: enrolled students submit once"
  on public.course_reviews for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and public.is_enrolled(course_id)
  );

drop policy if exists "course_reviews: admin full access" on public.course_reviews;
create policy "course_reviews: admin full access"
  on public.course_reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public aggregate: average rating + count, approved reviews only.
--
-- No security_invoker=false widening needed here (contrast with the
-- leaderboard views) — this view never surfaces anything beyond what the
-- "anyone reads approved" policy above already grants anon/authenticated
-- directly, so the default invoker-rights behaviour is correct.
-- ---------------------------------------------------------------------------

create or replace view public.course_review_stats as
select
  course_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*) as review_count
from public.course_reviews
where status = 'approved'
group by course_id;

grant select on public.course_review_stats to anon, authenticated;
