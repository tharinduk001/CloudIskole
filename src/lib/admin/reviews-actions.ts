"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Approves a pending review, making it publicly visible.
 *
 * Runs as the signed-in admin through the regular server client — the
 * "course_reviews: admin full access" RLS policy is the real gate, same
 * idiom as `deleteCourse` in courses-actions.ts.
 */
export async function approveReview(reviewId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("course_reviews")
    .update({
      status: "approved",
      moderated_at: new Date().toISOString(),
      moderated_by: admin.id,
    })
    .eq("id", reviewId);

  if (error) {
    console.error("approveReview failed", error);
    return { status: "error", message: "Could not approve this review." };
  }

  revalidatePath("/admin/reviews");
  return { status: "success" };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("course_reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("deleteReview failed", error);
    return { status: "error", message: "Could not delete this review." };
  }

  revalidatePath("/admin/reviews");
  return { status: "success" };
}
