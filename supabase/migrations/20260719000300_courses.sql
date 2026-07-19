-- ===========================================================================
-- 0003 · Courses, modules, lessons, enrollments and progress
-- ===========================================================================

create table public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  thumbnail_path text,

  level public.course_level not null default 'beginner',
  category text,

  is_free boolean not null default false,
  -- Integer cents, always LKR. 0 when is_free.
  price_cents bigint not null default 0,

  status public.content_status not null default 'draft',
  duration_minutes integer,
  sort_order integer not null default 0,

  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint courses_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint courses_price_non_negative check (price_cents >= 0),
  -- A free course cannot carry a price, and a paid course must have one.
  -- Enforcing this here means no application bug can create a "free" course
  -- that silently charges, or a paid course that is accidentally free.
  constraint courses_price_matches_free check (
    (is_free and price_cents = 0) or (not is_free and price_cents > 0)
  ),
  constraint courses_duration_positive check (
    duration_minutes is null or duration_minutes > 0
  )
);

create index courses_status_idx on public.courses (status, sort_order);
create index courses_category_idx on public.courses (category) where status = 'published';

create trigger courses_touch_updated_at
  before update on public.courses
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.modules (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  summary text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index modules_course_idx on public.modules (course_id, sort_order);

create trigger modules_touch_updated_at
  before update on public.modules
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.lessons (
  id uuid primary key default extensions.gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  -- Denormalised for RLS: lets an enrollment check run without joining up
  -- through modules on every single row read.
  course_id uuid not null references public.courses (id) on delete cascade,

  title text not null,
  slug text not null,
  type public.lesson_type not null default 'video',

  -- Unlisted YouTube video id, e.g. "dQw4w9WgXcQ".
  youtube_id text,
  content_mdx text,
  attachment_path text,

  duration_seconds integer,
  sort_order integer not null default 0,

  -- Free preview lessons are readable by anyone, which is how a paid course
  -- sells itself.
  is_preview boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (course_id, slug),
  constraint lessons_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint lessons_youtube_id_format check (
    youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'
  ),
  -- Each lesson type must actually carry its content.
  constraint lessons_content_present check (
    (type = 'video' and youtube_id is not null)
    or (type = 'text' and content_mdx is not null)
    or (type = 'pdf' and attachment_path is not null)
  )
);

create index lessons_module_idx on public.lessons (module_id, sort_order);
create index lessons_course_idx on public.lessons (course_id, sort_order);

create trigger lessons_touch_updated_at
  before update on public.lessons
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,

  status public.enrollment_status not null default 'active',

  -- Null for free courses; set for anything that was paid for. Provides the
  -- audit link from access granted back to money received.
  source_order_id uuid,

  progress_pct smallint not null default 0,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),

  -- One enrollment per student per course. This is the constraint that makes
  -- double-payment physically unable to produce double access.
  unique (user_id, course_id),
  constraint enrollments_progress_range check (progress_pct between 0 and 100)
);

create index enrollments_user_idx on public.enrollments (user_id, status);
create index enrollments_course_idx on public.enrollments (course_id);

create trigger enrollments_touch_updated_at
  before update on public.enrollments
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: does the current user hold access to this course?
-- ---------------------------------------------------------------------------

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments
    where course_id = p_course_id
      and user_id = (select auth.uid())
      and status in ('active', 'completed')
  );
$$;

revoke all on function public.is_enrolled(uuid) from public;
grant execute on function public.is_enrolled(uuid) to authenticated;

-- ---------------------------------------------------------------------------

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,

  completed_at timestamptz,
  seconds_watched integer not null default 0,
  last_seen_at timestamptz not null default now(),

  primary key (user_id, lesson_id),
  constraint lesson_progress_seconds_non_negative check (seconds_watched >= 0)
);

create index lesson_progress_course_idx on public.lesson_progress (user_id, course_id);

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- --- courses ---------------------------------------------------------------
-- Published courses are public: the catalogue is marketing, and anonymous
-- visitors must be able to browse before signing up.

create policy "courses: anyone reads published"
  on public.courses for select
  to anon, authenticated
  using (status = 'published');

create policy "courses: admin full access"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- modules ---------------------------------------------------------------

create policy "modules: anyone reads published course modules"
  on public.modules for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.status = 'published'
    )
  );

create policy "modules: admin full access"
  on public.modules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- lessons ---------------------------------------------------------------
-- The commercial boundary of the whole product. A lesson row is readable only
-- if it is a preview, or the course is free, or the reader is enrolled.
-- Nothing in the application layer can widen this.

create policy "lessons: preview lessons are public"
  on public.lessons for select
  to anon, authenticated
  using (
    is_preview
    and exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and c.status = 'published'
    )
  );

create policy "lessons: enrolled students read all lessons"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and c.status = 'published'
    )
    and public.is_enrolled(lessons.course_id)
  );

create policy "lessons: admin full access"
  on public.lessons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- enrollments -----------------------------------------------------------

create policy "enrollments: read own"
  on public.enrollments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Students may self-enroll in FREE published courses only. Paid enrollments
-- are created exclusively by grant_enrollment() after money is confirmed —
-- there is deliberately no policy that would let a student insert one.
create policy "enrollments: self-enroll in free courses"
  on public.enrollments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and source_order_id is null
    and status = 'active'
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_free and c.status = 'published'
    )
  );

create policy "enrollments: admin full access"
  on public.enrollments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- lesson_progress -------------------------------------------------------

create policy "lesson_progress: read own"
  on public.lesson_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "lesson_progress: write own for enrolled courses"
  on public.lesson_progress for insert
  to authenticated
  with check (
    user_id = (select auth.uid()) and public.is_enrolled(course_id)
  );

create policy "lesson_progress: update own"
  on public.lesson_progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "lesson_progress: admin reads all"
  on public.lesson_progress for select
  to authenticated
  using (public.is_admin());
