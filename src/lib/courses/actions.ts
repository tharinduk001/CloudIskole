"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";

const enrollSchema = z.object({
  courseId: z.uuid(),
  courseSlug: z.string().min(1),
});

/**
 * Self-enrolls the signed-in student in a free published course.
 *
 * The only thing standing between this and a free ride into a paid course is
 * the RLS policy "enrollments: self-enroll in free courses" — it checks
 * `is_free` and `status = 'published'` at the database, so even if this
 * action's own checks were buggy, a paid-course insert would still be
 * rejected server-side. Belt and braces: the friendly error here is for UX,
 * the policy is the actual guarantee.
 */
export async function enrollInFreeCourse(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = enrollSchema.safeParse({
    courseId: formData.get("courseId"),
    courseSlug: formData.get("courseSlug"),
  });

  if (!parsed.success) {
    return { status: "error", message: "That course could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to enrol." };
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, is_free, status")
    .eq("id", parsed.data.courseId)
    .maybeSingle();

  if (courseError || !course) {
    return { status: "error", message: "That course could not be found." };
  }

  if (!course.is_free || course.status !== "published") {
    return {
      status: "error",
      message: "This course requires payment. Paid enrollment is coming soon.",
    };
  }

  const { error: insertError } = await supabase
    .from("enrollments")
    .insert({ user_id: user.id, course_id: course.id });

  // 23505 = unique_violation. The student is already enrolled — treat that
  // as success rather than an error, since the end state they wanted (access
  // to the course) is already true.
  if (insertError && insertError.code !== "23505") {
    console.error("enrollInFreeCourse insert failed", insertError);
    return {
      status: "error",
      message: "We could not complete your enrolment. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/courses/${parsed.data.courseSlug}`);

  return { status: "success" };
}

const completeSchema = z.object({
  lessonId: z.uuid(),
  courseId: z.uuid(),
  courseSlug: z.string().min(1),
});

/**
 * Marks a lesson complete for the signed-in student and recomputes the
 * course's overall progress percentage.
 *
 * `lesson_progress` insert is itself RLS-gated on `is_enrolled(course_id)`
 * (see "lesson_progress: write own for enrolled courses" in the Phase 1
 * migrations), so a student cannot record progress on a course they are not
 * enrolled in even by calling this action directly with a guessed lesson id.
 */
export async function markLessonComplete(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = completeSchema.safeParse({
    lessonId: formData.get("lessonId"),
    courseId: formData.get("courseId"),
    courseSlug: formData.get("courseSlug"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Something went wrong. Please refresh and retry.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  const { lessonId, courseId, courseSlug } = parsed.data;

  const { error: upsertError } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (upsertError) {
    console.error("markLessonComplete upsert failed", upsertError);
    return { status: "error", message: "We could not save your progress. Please retry." };
  }

  // Recompute progress_pct from the actual lesson/progress counts rather than
  // incrementing a counter — a counter can drift if a lesson is later added
  // or removed from the course; a recount from source cannot. This calls a
  // SECURITY DEFINER function rather than updating `enrollments` directly:
  // that table has no student UPDATE policy at all, deliberately, so a
  // hand-crafted request cannot PATCH progress_pct straight to 100.
  const { error: recomputeError } = await supabase.rpc("recompute_enrollment_progress", {
    p_course_id: courseId,
  });

  if (recomputeError) {
    // Progress was recorded even if this rollup failed; the student's work is
    // not lost, only the summary percentage is stale until the next lesson.
    console.error("recompute_enrollment_progress failed", recomputeError);
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: enrollment?.status === "completed" ? "Course complete!" : "Progress saved.",
  };
}
