import "server-only";

import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Course-domain data access.
 *
 * Every function here runs as the signed-in user (or anon), so RLS is the
 * real gate — a paid lesson's `content_mdx` simply is not in the row set
 * returned to an unenrolled student. These functions add shaping and
 * not-found handling on top; they do not themselves decide who sees what.
 *
 * One exception, deliberately: the course **syllabus** (title/type/duration
 * per lesson, not the lesson content) is fetched through
 * `get_course_outline_public()`, a SECURITY DEFINER function — see that
 * migration's comment for why plain RLS is the wrong tool for "show the full
 * table of contents, but keep the paid rows locked."
 */

export type CourseSummary = Database["public"]["Tables"]["courses"]["Row"];
export type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

/** A lesson as it appears in the public syllabus: structure, no content. */
export type OutlineLesson = {
  id: string;
  title: string;
  slug: string;
  type: Database["public"]["Enums"]["lesson_type"];
  duration_seconds: number | null;
  is_preview: boolean;
  sort_order: number;
};

export type OutlineModule = {
  id: string;
  title: string;
  sort_order: number;
  lessons: OutlineLesson[];
};

export type CourseWithOutline = CourseSummary & {
  modules: OutlineModule[];
};

/**
 * Published courses for the public catalogue, newest-curated-first.
 *
 * Accepts an optional pre-built client so callers that must avoid touching
 * request-scoped cookies — `sitemap.ts`, notably — can pass a
 * `createStaticClient()` instead and keep their route statically generated.
 */
export async function listPublishedCourses(
  supabaseClient?: SupabaseClient<Database>,
): Promise<CourseSummary[]> {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load courses: ${error.message}`);
  return data;
}

/** Groups the flat rows from `get_course_outline_public` into modules. */
function shapePublicOutline(
  rows: {
    module_id: string;
    module_title: string;
    module_sort_order: number;
    lesson_id: string;
    lesson_title: string;
    lesson_slug: string;
    lesson_type: Database["public"]["Enums"]["lesson_type"];
    duration_seconds: number | null;
    is_preview: boolean;
    lesson_sort_order: number;
  }[],
): OutlineModule[] {
  const byModule = new Map<string, OutlineModule>();

  for (const row of rows) {
    let outlineModule = byModule.get(row.module_id);
    if (!outlineModule) {
      outlineModule = {
        id: row.module_id,
        title: row.module_title,
        sort_order: row.module_sort_order,
        lessons: [],
      };
      byModule.set(row.module_id, outlineModule);
    }
    outlineModule.lessons.push({
      id: row.lesson_id,
      title: row.lesson_title,
      slug: row.lesson_slug,
      type: row.lesson_type,
      duration_seconds: row.duration_seconds,
      is_preview: row.is_preview,
      sort_order: row.lesson_sort_order,
    });
  }

  return [...byModule.values()].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * A published course with its full syllabus, shaped for the outline.
 *
 * Every lesson the course actually contains is listed here — including
 * locked ones — with title, type and duration but no content, so the course
 * page can sell what a paid course contains rather than showing an
 * incomplete or empty table of contents. `notFound()` covers both "does not
 * exist" and "not published", indistinguishable to a visitor and both
 * correctly a 404 rather than a hint about which case occurred.
 */
export async function getCourseOutline(slug: string): Promise<CourseWithOutline> {
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (courseError) throw new Error(`Failed to load course: ${courseError.message}`);
  if (!course) notFound();

  const { data: rows, error: outlineError } = await supabase.rpc(
    "get_course_outline_public",
    { p_course_id: course.id },
  );

  if (outlineError) throw new Error(`Failed to load outline: ${outlineError.message}`);

  return { ...course, modules: shapePublicOutline(rows ?? []) };
}

/** Whether the given user holds an active or completed enrollment. */
export async function getEnrollment(courseId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load enrollment: ${error.message}`);
  return data;
}

/**
 * A single lesson plus its course/syllabus context, for the lesson viewer.
 *
 * `lesson` is fetched as a full row through the normal RLS-gated query, so
 * `content_mdx`/`youtube_id`/`attachment_path` are present only when the
 * viewer is actually entitled to them — navigating straight to a locked
 * lesson's URL still 404s here, same as before. `outline` is the public
 * syllabus (see `getCourseOutline`), used only for the sidebar and prev/next
 * navigation, which should show the whole course regardless of lock state.
 */
export async function getLessonForViewer(courseSlug: string, lessonSlug: string) {
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", courseSlug)
    .eq("status", "published")
    .maybeSingle();

  if (courseError) throw new Error(`Failed to load course: ${courseError.message}`);
  if (!course) notFound();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", course.id)
    .eq("slug", lessonSlug)
    .maybeSingle();

  if (lessonError) throw new Error(`Failed to load lesson: ${lessonError.message}`);
  if (!lesson) notFound();

  const { data: rows, error: outlineError } = await supabase.rpc(
    "get_course_outline_public",
    { p_course_id: course.id },
  );

  if (outlineError) throw new Error(`Failed to load outline: ${outlineError.message}`);

  return { course, lesson, outline: shapePublicOutline(rows ?? []) };
}

/** Flat, ordered lesson list from a module outline — used for prev/next. */
export function flattenLessons<L>(outline: { lessons: L[] }[]): L[] {
  return outline.flatMap((m) => m.lessons);
}

/** This user's progress rows for a course, keyed by lesson id. */
export async function getLessonProgressMap(
  courseId: string,
  userId: string,
): Promise<Map<string, { completed_at: string | null }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed_at")
    .eq("course_id", courseId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to load progress: ${error.message}`);
  return new Map(
    (data ?? []).map((r) => [r.lesson_id, { completed_at: r.completed_at }]),
  );
}

export type EnrolledCourse = {
  enrollment: Database["public"]["Tables"]["enrollments"]["Row"];
  course: CourseSummary;
};

/** A student's active/completed enrollments, most recently touched first. */
export async function listMyEnrollments(userId: string): Promise<EnrolledCourse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("user_id", userId)
    .in("status", ["active", "completed"])
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to load enrollments: ${error.message}`);

  return (data ?? []).flatMap((row) => {
    const { courses: course, ...enrollment } = row;
    // A course can be unpublished after enrollment; skip rather than crash.
    return course ? [{ enrollment, course }] : [];
  });
}

/**
 * The first not-yet-completed lesson in a course, for "continue learning".
 *
 * Unlike the public syllabus helpers above, this reads `lessons` directly —
 * correctly, since it is only ever called for an enrolled user, for whom RLS
 * already returns every lesson in the course.
 */
export async function getNextLesson(
  courseId: string,
  userId: string,
): Promise<LessonRow | null> {
  const supabase = await createClient();

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (modulesError) throw new Error(`Failed to load modules: ${modulesError.message}`);

  const lessons = flattenLessons<LessonRow>(
    (modules ?? []).map((m) => ({
      ...m,
      lessons: [...m.lessons].sort((a, b) => a.sort_order - b.sort_order),
    })),
  );
  if (lessons.length === 0) return null;

  const progress = await getLessonProgressMap(courseId, userId);
  return lessons.find((l) => !progress.get(l.id)?.completed_at) ?? lessons[0] ?? null;
}
