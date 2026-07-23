"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  courseId: z.uuid(),
  courseSlug: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Please choose a star rating.").max(5),
  body: z.string().trim().max(2000).optional(),
});

/**
 * Submits a student's rating + review for a course.
 *
 * Enrollment and one-per-course are enforced by the "course_reviews:
 * enrolled students submit once" RLS policy and the (course_id, user_id)
 * unique constraint (20260723000200_course_reviews.sql) — the checks here
 * exist only to turn those into a friendly message instead of a raw
 * database error.
 */
export async function submitCourseReview(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse({
    courseId: formData.get("courseId"),
    courseSlug: formData.get("courseSlug"),
    rating: formData.get("rating"),
    body: formData.get("body") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check your review.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to leave a review." };
  }

  const { error } = await supabase.from("course_reviews").insert({
    course_id: parsed.data.courseId,
    user_id: user.id,
    rating: parsed.data.rating,
    body: parsed.data.body ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "You've already reviewed this course." };
    }
    console.error("submitCourseReview failed", error);
    return {
      status: "error",
      message:
        error.code === "42501"
          ? "You need to be enrolled in this course to leave a review."
          : "We could not save your review. Please try again.",
    };
  }

  revalidatePath(`/courses/${parsed.data.courseSlug}`);
  return {
    status: "success",
    message: "Thanks! Your review will appear once it's approved.",
  };
}
