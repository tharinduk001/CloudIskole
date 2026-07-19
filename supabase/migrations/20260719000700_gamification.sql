-- ===========================================================================
-- 0007 · XP, streaks, badges, certificates and the leaderboard
--
-- XP is event-sourced rather than stored as a mutable counter on the profile.
-- A counter column can drift, can be double-incremented by a retried request,
-- and can be tampered with by whoever owns the row. A ledger of immutable
-- events with a uniqueness constraint per source cannot.
-- ===========================================================================

create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- e.g. 'lesson.completed', 'quiz.passed', 'session.attended', 'course.completed'
  source text not null,
  -- The specific entity that earned it. Combined with `source`, this is what
  -- makes awarding idempotent.
  source_id uuid,

  points integer not null,
  created_at timestamptz not null default now(),

  constraint xp_events_points_positive check (points > 0)
);

-- The same lesson can never be worth XP twice.
create unique index xp_events_unique_award
  on public.xp_events (user_id, source, source_id)
  where source_id is not null;

create index xp_events_user_idx on public.xp_events (user_id, created_at desc);
create index xp_events_recent_idx on public.xp_events (created_at desc);

create trigger xp_events_no_update
  before update or delete on public.xp_events
  for each statement execute function public.tg_reject_mutation();

-- ---------------------------------------------------------------------------
-- award_xp — idempotent by construction
-- ---------------------------------------------------------------------------

create or replace function public.award_xp(
  p_user_id uuid,
  p_source text,
  p_source_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.xp_events (user_id, source, source_id, points)
  values (p_user_id, p_source, p_source_id, p_points)
  on conflict do nothing;
end;
$$;

revoke all on function public.award_xp(uuid, text, uuid, integer) from public;
grant execute on function public.award_xp(uuid, text, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Streaks — derived from distinct active days, in Sri Lankan local time.
-- ---------------------------------------------------------------------------

create table public.user_activity_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Local Colombo date, so a 1am study session counts for the right day.
  activity_date date not null,
  primary key (user_id, activity_date)
);

create or replace function public.current_streak(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with days as (
    select activity_date,
           activity_date - (row_number() over (order by activity_date))::integer as grp
    from public.user_activity_days
    where user_id = p_user_id
  ),
  runs as (
    select grp, count(*) as len, max(activity_date) as last_day
    from days group by grp
  )
  select coalesce(
    (select len::integer from runs
     where last_day >= (now() at time zone 'Asia/Colombo')::date - 1
     order by last_day desc limit 1),
    0
  );
$$;

grant execute on function public.current_streak(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard
--
-- A view rather than a materialised view: at the scale of a few thousand
-- students this aggregates in single-digit milliseconds off the indexes, and
-- avoids the staleness and refresh-scheduling that a matview would add.
-- Revisit if xp_events passes a few million rows.
--
-- Students who have not opted in are excluded here, at the data layer — not
-- filtered out in the UI where a missed condition would expose them.
-- ---------------------------------------------------------------------------

create view public.leaderboard_all_time
with (security_invoker = false)
as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.district,
  sum(x.points)::bigint as xp,
  rank() over (order by sum(x.points) desc) as rank
from public.xp_events x
join public.profiles p on p.id = x.user_id
where p.leaderboard_opt_in
group by p.id, p.full_name, p.avatar_url, p.district;

comment on view public.leaderboard_all_time is
  'Opt-in only. security_invoker=false is intentional: the view itself is the '
  'authorised projection, exposing only display fields of consenting users.';

grant select on public.leaderboard_all_time to anon, authenticated;

create view public.leaderboard_monthly
with (security_invoker = false)
as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.district,
  sum(x.points)::bigint as xp,
  rank() over (order by sum(x.points) desc) as rank
from public.xp_events x
join public.profiles p on p.id = x.user_id
where p.leaderboard_opt_in
  and x.created_at >= date_trunc('month', now() at time zone 'Asia/Colombo')
group by p.id, p.full_name, p.avatar_url, p.district;

grant select on public.leaderboard_monthly to anon, authenticated;

-- ===========================================================================
-- Badges
-- ===========================================================================

create table public.badges (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now(),
  constraint badges_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ===========================================================================
-- Certificates
-- ===========================================================================

create table public.certificates (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,

  -- Public verification code printed on the certificate, e.g. "CI-4F2A-88KD".
  code text not null unique,
  issued_at timestamptz not null default now(),
  pdf_path text,

  -- External digital badge (e.g. credentials.certdirectory.io), recorded once
  -- issued so the certificate page can link to it.
  external_badge_url text,

  revoked_at timestamptz,
  revoke_reason text,

  unique (user_id, course_id),
  constraint certificates_code_format check (code ~ '^CI-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  constraint certificates_revoke_complete check (
    (revoked_at is null) = (revoke_reason is null)
  )
);

create index certificates_user_idx on public.certificates (user_id, issued_at desc);

-- Public verification projection: proves a certificate is genuine without
-- exposing the holder's email, phone or anything else on their profile.
create view public.certificate_verification
with (security_invoker = false)
as
select
  c.code,
  p.full_name as holder_name,
  co.title as course_title,
  c.issued_at,
  (c.revoked_at is null) as is_valid
from public.certificates c
join public.profiles p on p.id = c.user_id
join public.courses co on co.id = c.course_id;

grant select on public.certificate_verification to anon, authenticated;

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.xp_events enable row level security;
alter table public.user_activity_days enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.certificates enable row level security;

create policy "xp_events: read own"
  on public.xp_events for select to authenticated
  using (user_id = (select auth.uid()));

create policy "xp_events: admin reads all"
  on public.xp_events for select to authenticated
  using (public.is_admin());

create policy "user_activity_days: read own"
  on public.user_activity_days for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_activity_days: record own"
  on public.user_activity_days for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "badges: anyone reads"
  on public.badges for select to anon, authenticated using (true);

create policy "badges: admin manages"
  on public.badges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "user_badges: read own"
  on public.user_badges for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_badges: admin full access"
  on public.user_badges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "certificates: read own"
  on public.certificates for select to authenticated
  using (user_id = (select auth.uid()));

create policy "certificates: admin full access"
  on public.certificates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
