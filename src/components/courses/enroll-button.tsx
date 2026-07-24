"use client";

import { ArrowRight, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { idleResult } from "@/lib/actions/result";
import { enrollInFreeCourse } from "@/lib/courses/actions";
import { startCheckout } from "@/lib/payments/actions";

export function EnrollFreeButton({
  courseId,
  courseSlug,
  firstLessonHref,
}: {
  courseId: string;
  courseSlug: string;
  /** Where to send the student once enrolled. */
  firstLessonHref: string | null;
}) {
  const [state, action, pending] = useActionState(enrollInFreeCourse, idleResult);

  if (state.status === "success") {
    return (
      <Button
        asChild
        size="lg"
        className="bg-terracotta-600 hover:bg-terracotta-700 w-full rounded-none"
      >
        <Link href={firstLessonHref ?? `/courses/${courseSlug}`}>
          Start learning
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="courseSlug" value={courseSlug} />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="bg-terracotta-600 hover:bg-terracotta-700 w-full rounded-none"
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Enrol now
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

/**
 * Opens (or resumes) a bank-transfer order and sends the student to
 * checkout. `startCheckout` is idempotent — a student who already has a
 * pending or under-review order for this course lands back on the same
 * order instead of a new one.
 */
export function StartCheckoutButton({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(startCheckout, idleResult);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="bg-terracotta-600 hover:bg-terracotta-700 w-full rounded-none"
      >
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <CreditCard aria-hidden="true" />
        )}
        Enrol via bank transfer
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
