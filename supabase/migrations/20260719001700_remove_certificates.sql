-- ===========================================================================
-- 0017 · Remove the internal certificate system
--
-- Digital credentials now come exclusively from credentials.certdirectory.io
-- (Open Badge 3.0), issued and managed there directly — CloudIskole no
-- longer needs to be a second, competing source of "proof of completion".
-- Badges (XP-driven, in-app achievements) stay; certificates go entirely:
-- the table, its public verification view, the storage bucket, and the
-- certificate-issuing step inside course completion.
-- ===========================================================================

-- Storage: drop the certificates bucket's object policies. Supabase blocks
-- direct DELETE on both storage.objects and storage.buckets via plain SQL
-- (must go through the Storage API instead), so the empty bucket row itself
-- stays — but with its policies gone, storage RLS's default-deny makes it
-- completely unreachable, same practical effect as if it did not exist. If
-- you want the row itself gone too, delete it from the Storage section of
-- the Supabase dashboard once on the hosted project.
drop policy if exists "certificates: owner reads own" on storage.objects;
drop policy if exists "certificates: admin full access" on storage.objects;

-- Course completion no longer mints a certificate — just XP, activity, and
-- (on a student's first-ever course completion) the Course Graduate badge.
-- The `on conflict do nothing` on user_badges already makes the badge award
-- idempotent per user, so no "had this happened before" check is needed —
-- the certificates table was the only reason that check existed.
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
begin
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
    and status in ('active', 'completed');

  perform set_config('app.trusted_write', 'off', true);

  if v_is_complete and not coalesce(v_was_complete, false) then
    perform public.award_xp(v_user_id, 'course.completed', p_course_id, 50);
    perform public.record_activity(v_user_id);

    insert into public.user_badges (user_id, badge_id)
    select v_user_id, b.id from public.badges b where b.slug = 'first-course-complete'
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.recompute_enrollment_progress(uuid, uuid) from public;
grant execute on function public.recompute_enrollment_progress(uuid, uuid)
  to authenticated, service_role;

drop view if exists public.certificate_verification;
drop table if exists public.certificates;
