-- ===========================================================================
-- 0021 · Admin dashboard: student summary view + revenue/enrollment trends
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- student_admin_summary — one row per student, pre-aggregated so the admin
-- students list is a single query instead of N+1.
--
-- No security_invoker override needed: left at the default (invoker rights),
-- so a non-admin selecting this view still only ever sees their own profile
-- row (per "profiles: read own"), which collapses every join to themselves —
-- harmless. An admin sees every row because "profiles: admin reads all"
-- already grants that at the base-table level.
-- ---------------------------------------------------------------------------

-- Each metric is its own correlated subquery rather than a join, deliberately:
-- joining enrollments + orders + xp_events directly on user_id would fan out
-- into a cross product per student (2 enrollments x 1 order x 2 xp_events =
-- 4 rows), silently multiplying every sum/count by however many rows the
-- OTHER joins happened to contribute. Subqueries keep each aggregate scoped
-- to exactly the table it counts.
create or replace view public.student_admin_summary as
select
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.created_at,
  (
    select count(*) from public.enrollments e
    where e.user_id = p.id and e.status in ('active', 'completed')
  ) as enrollment_count,
  (
    select count(*) from public.enrollments e
    where e.user_id = p.id and e.status = 'completed'
  ) as completed_count,
  (
    select coalesce(sum(o.amount_cents), 0) from public.orders o
    where o.user_id = p.id and o.status = 'paid'
  ) as total_spent_cents,
  (
    select coalesce(sum(x.points), 0) from public.xp_events x
    where x.user_id = p.id
  ) as total_xp
from public.profiles p
where p.role = 'student';

grant select on public.student_admin_summary to authenticated;

-- ---------------------------------------------------------------------------
-- revenue_over_time / enrollments_over_time — daily buckets for the
-- dashboard's trend charts. Supabase's JS client cannot GROUP BY directly, so
-- these ship as SQL functions rather than a view + client-side aggregation.
--
-- Admin-only via an internal is_admin() guard (same idiom as
-- admin_set_user_role() in 20260719000200_profiles.sql) rather than a
-- service_role-only grant: this is a read-only aggregate, not a privileged
-- mutation, so there's no reason to bypass RLS-equivalent checking the way
-- grant_enrollment()/reject_order() must for money-moving writes.
-- ---------------------------------------------------------------------------

create or replace function public.revenue_over_time(p_since timestamptz)
returns table (day date, revenue_cents bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may read revenue analytics'
      using errcode = '42501';
  end if;

  return query
    select date_trunc('day', o.paid_at)::date as day, sum(o.amount_cents)::bigint
    from public.orders o
    where o.status = 'paid'
      and (p_since is null or o.paid_at >= p_since)
    group by 1
    order by 1;
end;
$$;

revoke all on function public.revenue_over_time(timestamptz) from public;
grant execute on function public.revenue_over_time(timestamptz) to authenticated;

create or replace function public.enrollments_over_time(p_since timestamptz)
returns table (day date, enrollment_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may read enrollment analytics'
      using errcode = '42501';
  end if;

  return query
    select date_trunc('day', e.enrolled_at)::date as day, count(*)::bigint
    from public.enrollments e
    where p_since is null or e.enrolled_at >= p_since
    group by 1
    order by 1;
end;
$$;

revoke all on function public.enrollments_over_time(timestamptz) from public;
grant execute on function public.enrollments_over_time(timestamptz) to authenticated;
