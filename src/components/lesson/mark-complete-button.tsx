"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { idleResult } from "@/lib/actions/result";
import { markLessonComplete } from "@/lib/courses/actions";

export function MarkCompleteButton({
  lessonId,
  courseId,
  courseSlug,
  initiallyCompleted,
}: {
  lessonId: string;
  courseId: string;
  courseSlug: string;
  initiallyCompleted: boolean;
}) {
  const [state, action, pending] = useActionState(markLessonComplete, idleResult);
  // Derived, not synced via effect: once the action reports success the
  // lesson is done for the rest of the session, even before the server
  // component tree re-renders with fresh data.
  const done = initiallyCompleted || state.status === "success";

  if (done) {
    return (
      <span className="border-success/20 bg-success-soft text-success inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Completed
      </span>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="courseSlug" value={courseSlug} />
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 aria-hidden="true" />
        )}
        Mark as complete
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
