-- ===========================================================================
-- 0006 · Live sessions and registrations
-- ===========================================================================

create table public.sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_path text,

  -- Always stored UTC; rendered in Asia/Colombo by the application.
  starts_at timestamptz not null,
  duration_minutes integer not null default 60,

  host_name text,
  -- Private: revealed only to registered students, close to start time.
  join_url text,
  recording_url text,

  capacity integer,
  is_free boolean not null default true,
  course_id uuid references public.courses (id) on delete set null,

  status public.session_status not null default 'upcoming',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sessions_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint sessions_duration_positive check (duration_minutes > 0),
  constraint sessions_capacity_positive check (capacity is null or capacity > 0),
  constraint sessions_recording_only_when_done check (
    recording_url is null or status = 'completed'
  )
);

create index sessions_upcoming_idx on public.sessions (starts_at)
  where status in ('upcoming', 'live');
create index sessions_status_idx on public.sessions (status, starts_at desc);

create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.session_registrations (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  registered_at timestamptz not null default now(),
  attended boolean not null default false,
  attended_marked_at timestamptz,

  unique (session_id, user_id)
);

create index session_registrations_user_idx
  on public.session_registrations (user_id, registered_at desc);
create index session_registrations_session_idx
  on public.session_registrations (session_id);

-- ---------------------------------------------------------------------------
-- Capacity is enforced in the database, not the application. Two students
-- clicking Register on the last seat at the same moment cannot both succeed:
-- the advisory lock serialises them.
-- ---------------------------------------------------------------------------

create or replace function public.tg_enforce_session_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_taken integer;
  v_status public.session_status;
begin
  select capacity, status into v_capacity, v_status
  from public.sessions where id = new.session_id;

  if v_status <> 'upcoming' then
    raise exception 'Registration is closed for this session' using errcode = '22023';
  end if;

  if v_capacity is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.session_id::text));

  select count(*) into v_taken
  from public.session_registrations where session_id = new.session_id;

  if v_taken >= v_capacity then
    raise exception 'This session is full' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger session_registrations_capacity
  before insert on public.session_registrations
  for each row execute function public.tg_enforce_session_capacity();

-- Attendance is a staff judgement, not something a student can assert.
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
  return new;
end;
$$;

create trigger session_registrations_protect_attendance
  before update on public.session_registrations
  for each row execute function public.tg_protect_attendance();

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.sessions enable row level security;
alter table public.session_registrations enable row level security;

-- The session list is public marketing, but `join_url` must not be. Postgres
-- RLS is row-level, not column-level, so the application reads sessions
-- through the view below for anonymous/unregistered visitors.
create policy "sessions: anyone reads non-draft sessions"
  on public.sessions for select
  to anon, authenticated
  using (status <> 'cancelled');

create policy "sessions: admin full access"
  on public.sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public projection with the join link removed. Anonymous listings read this.
create view public.sessions_public
with (security_invoker = true)
as
select
  id, slug, title, description, cover_image_path,
  starts_at, duration_minutes, host_name,
  capacity, is_free, course_id, status, recording_url,
  created_at
from public.sessions
where status <> 'cancelled';

comment on view public.sessions_public is
  'Session listing without join_url. security_invoker keeps the caller''s RLS in force.';

grant select on public.sessions_public to anon, authenticated;

-- --- registrations ---------------------------------------------------------

create policy "session_registrations: read own"
  on public.session_registrations for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "session_registrations: register self"
  on public.session_registrations for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and attended = false
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.status = 'upcoming'
    )
  );

create policy "session_registrations: cancel own"
  on public.session_registrations for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.status = 'upcoming'
    )
  );

create policy "session_registrations: admin full access"
  on public.session_registrations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
