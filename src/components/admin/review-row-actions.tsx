"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { approveReview, deleteReview } from "@/lib/admin/reviews-actions";

export function ReviewRowActions({
  reviewId,
  pending,
  courseTitle,
}: {
  reviewId: string;
  pending: boolean;
  courseTitle: string;
}) {
  const router = useRouter();
  const [approving, startApprove] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-3">
      {error ? <span className="text-danger text-xs">{error}</span> : null}
      {pending ? (
        <button
          type="button"
          disabled={approving}
          onClick={() => {
            setError(null);
            startApprove(async () => {
              const result = await approveReview(reviewId);
              if (result.status === "error") {
                setError(result.message);
                return;
              }
              router.refresh();
            });
          }}
          className="text-success inline-flex items-center gap-1.5 text-xs font-medium hover:underline disabled:opacity-50"
        >
          {approving ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          )}
          Approve
        </button>
      ) : null}
      <ConfirmDeleteButton
        label="Delete review"
        confirmMessage={`Delete this review of "${courseTitle}"?`}
        onDelete={() => deleteReview(reviewId)}
      />
    </div>
  );
}
