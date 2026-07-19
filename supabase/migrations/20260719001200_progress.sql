-- ===========================================================================
-- 0012 · recompute_enrollment_progress
--
-- Bug this fixes: `enrollments` never had a student-facing UPDATE policy —
-- only "enrollments: admin full access" existed. Marking a lesson complete
-- wrote the `lesson_progress` row fine, but the follow-up UPDATE to
-- `enrollments.progress_pct` was silently dropped by RLS (0 rows affected,
-- no error), so a student's course page always showed 0% no matter how much
-- they finished.
--
-- The fix is NOT "add an UPDATE policy for students" — that would let a
-- student PATCH `progress_pct = 100` and `status = 'completed'` directly,
-- fabricating a certificate-eligible course completion with a single hand
-- crafted request. Progress must be *computed*, never *asserted*. This
-- function is the only path: it recounts completed lessons itself and is the
-- one thing with permission to write the result.
-- ===========================================================================

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
end;
$$;

revoke all on function public.recompute_enrollment_progress(uuid, uuid) from public;
grant execute on function public.recompute_enrollment_progress(uuid, uuid)
  to authenticated, service_role;
