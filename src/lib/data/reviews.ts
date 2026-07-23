import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CourseReviewStats = {
  average_rating: number;
  review_count: number;
};

export type CourseReview = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  reviewer_name: string;
};

/** Average rating + count for a course's approved reviews. Null if none yet. */
export async function getCourseReviewStats(
  courseId: string,
): Promise<CourseReviewStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_review_stats")
    .select("average_rating, review_count")
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load review stats: ${error.message}`);
  if (!data || data.average_rating === null || data.review_count === null) return null;
  return { average_rating: data.average_rating, review_count: data.review_count };
}

/** Approved reviews for a course, most recent first. */
export async function listApprovedReviews(
  courseId: string,
  limit = 20,
): Promise<CourseReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_reviews")
    .select(
      "id, rating, body, created_at, reviewer:profiles!course_reviews_user_id_fkey(full_name)",
    )
    .eq("course_id", courseId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load reviews: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    body: row.body,
    created_at: row.created_at,
    reviewer_name:
      (row.reviewer as { full_name: string } | null)?.full_name || "A student",
  }));
}

/** The signed-in user's own review for a course, whatever its status. */
export async function getMyReview(courseId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_reviews")
    .select("id, rating, body, status")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load your review: ${error.message}`);
  return data;
}
