"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { StarRatingInput } from "@/components/courses/star-rating";
import { Button } from "@/components/ui/button";
import { idleResult } from "@/lib/actions/result";
import { submitCourseReview } from "@/lib/reviews/actions";

export function ReviewForm({
  courseId,
  courseSlug,
}: {
  courseId: string;
  courseSlug: string;
}) {
  const [state, action, pending] = useActionState(submitCourseReview, idleResult);

  if (state.status === "success") {
    return (
      <p className="border-hairline bg-terracotta-50 text-onyx-soft rounded-none border p-4 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form
      action={action}
      className="border-hairline flex flex-col gap-4 rounded-none border p-5"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="courseSlug" value={courseSlug} />
      <div>
        <p className="text-onyx text-sm font-medium">Rate this course</p>
        <div className="mt-2">
          <StarRatingInput name="rating" />
        </div>
      </div>
      <textarea
        name="body"
        rows={3}
        maxLength={2000}
        placeholder="Share what you learned or how the course helped you (optional)"
        className="border-hairline text-onyx placeholder:text-mist-soft focus:border-terracotta-500 w-full resize-y rounded-none border px-4 py-3 text-sm focus:outline-none"
      />
      <Button
        type="submit"
        disabled={pending}
        className="bg-terracotta-600 hover:bg-terracotta-700 self-start rounded-none"
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Submit review
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
