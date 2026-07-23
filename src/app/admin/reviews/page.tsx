import type { Metadata } from "next";

import { ReviewRowActions } from "@/components/admin/review-row-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/courses/star-rating";
import { listAllReviews } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await listAllReviews();
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Reviews</h1>
      <p className="text-ink-muted mt-1 text-sm">
        {pendingCount} awaiting review, {reviews.length} shown total.
      </p>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {reviews.map((review) => (
              <tr key={review.id} className="align-top hover:bg-teal-50/40">
                <td className="text-ink px-4 py-3 font-medium">{review.course.title}</td>
                <td className="px-4 py-3">
                  <div className="text-ink">{review.reviewer.full_name}</div>
                  <div className="text-ink-subtle text-xs">{review.reviewer.email}</div>
                </td>
                <td className="px-4 py-3">
                  <StarRating rating={review.rating} size="sm" />
                </td>
                <td className="text-ink-muted max-w-xs px-4 py-3 text-sm">
                  {review.body || (
                    <span className="text-ink-subtle italic">No comment</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={review.status === "approved" ? "success" : "warning"}
                    size="sm"
                  >
                    {review.status}
                  </Badge>
                </td>
                <td className="text-ink-subtle px-4 py-3 text-xs">
                  {new Date(review.created_at).toLocaleDateString("en-LK")}
                </td>
                <td className="px-4 py-3">
                  <ReviewRowActions
                    reviewId={review.id}
                    pending={review.status === "pending"}
                    courseTitle={review.course.title}
                  />
                </td>
              </tr>
            ))}
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-ink-muted px-4 py-8 text-center">
                  No reviews yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
