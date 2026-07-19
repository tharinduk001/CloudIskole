-- ===========================================================================
-- 0011 · Public course outline (syllabus) function
--
-- Bug this fixes: the course detail page listed modules/lessons straight from
-- `public.lessons`, which is RLS-gated to preview lessons for an unenrolled
-- visitor. That does not just hide a locked lesson's content — it hides the
-- ROW, so entire modules rendered empty and the header showed "1 lesson" on
-- a 5-lesson course. A prospective student could not see what they would be
-- paying for.
--
-- The fix is a SECURITY DEFINER function that returns the SYLLABUS — title,
-- type, duration, order, preview flag — for every lesson in a published
-- course, regardless of enrollment. It deliberately does not select
-- `content_mdx`, `youtube_id` or `attachment_path`: those stay behind the
-- existing lesson-row RLS, unchanged. This function can reveal *that* a
-- lesson called "Writing Your First Dockerfile" exists and runs 5 minutes;
-- it cannot reveal the lesson itself.
-- ===========================================================================

create or replace function public.get_course_outline_public(p_course_id uuid)
returns table (
  module_id uuid,
  module_title text,
  module_sort_order integer,
  lesson_id uuid,
  lesson_title text,
  lesson_slug text,
  lesson_type public.lesson_type,
  duration_seconds integer,
  is_preview boolean,
  lesson_sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.title, m.sort_order,
    l.id, l.title, l.slug, l.type, l.duration_seconds, l.is_preview, l.sort_order
  from public.modules m
  join public.lessons l on l.module_id = m.id
  where m.course_id = p_course_id
    -- Mirrors the "courses: anyone reads published" policy: the syllabus of
    -- a draft course is not public just because someone learns its id.
    and exists (
      select 1 from public.courses c
      where c.id = p_course_id and c.status = 'published'
    )
  order by m.sort_order, l.sort_order;
$$;

revoke all on function public.get_course_outline_public(uuid) from public;
grant execute on function public.get_course_outline_public(uuid) to anon, authenticated;
