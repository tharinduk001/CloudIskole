-- ===========================================================================
-- Remove profiles.district and profiles.al_year
--
-- Neither field is used anywhere in the product anymore. Both leaderboard
-- views project `district`, so they have to be dropped and recreated first —
-- `create or replace view` cannot remove a column from an existing view.
-- ===========================================================================

drop view if exists public.leaderboard_monthly;
drop view if exists public.leaderboard_all_time;

alter table public.profiles drop constraint if exists profiles_al_year_sane;
alter table public.profiles drop column if exists district;
alter table public.profiles drop column if exists al_year;

create view public.leaderboard_all_time
with (security_invoker = false)
as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  sum(x.points)::bigint as xp,
  rank() over (order by sum(x.points) desc) as rank
from public.xp_events x
join public.profiles p on p.id = x.user_id
where p.leaderboard_opt_in
group by p.id, p.full_name, p.avatar_url;

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
  sum(x.points)::bigint as xp,
  rank() over (order by sum(x.points) desc) as rank
from public.xp_events x
join public.profiles p on p.id = x.user_id
where p.leaderboard_opt_in
  and x.created_at >= date_trunc('month', now() at time zone 'Asia/Colombo')
group by p.id, p.full_name, p.avatar_url;

grant select on public.leaderboard_monthly to anon, authenticated;

-- Column privileges must be re-granted without the dropped columns; Postgres
-- has no "grant update (all columns except X)" shorthand.
revoke update on table public.profiles from authenticated;

grant update (
  full_name,
  avatar_url,
  phone,
  leaderboard_opt_in,
  marketing_opt_in
) on table public.profiles to authenticated;
