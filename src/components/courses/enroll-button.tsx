"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { idleResult } from "@/lib/actions/result";
import { enrollInFreeCourse } from "@/lib/courses/actions";

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
      <Button asChild size="lg" className="w-full sm:w-auto">
        <Link href={firstLessonHref ?? `/courses/${courseSlug}`}>
          Start learning
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 sm:items-start">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="courseSlug" value={courseSlug} />
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Enrol for free
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

/** Shown for paid courses until the Phase 3 payment flow ships. */
export function PaidEnrollComingSoon() {
  return (
    <div className="flex flex-col gap-2 sm:items-start">
      <Button size="lg" disabled className="w-full sm:w-auto">
        <Lock aria-hidden="true" />
        Paid enrolment opening soon
      </Button>
      <p className="text-ink-subtle text-xs">
        Bank transfer enrolment is on its way.{" "}
        <Link href="/contact" className="font-medium text-teal-600 hover:underline">
          Contact us
        </Link>{" "}
        to be notified.
      </p>
    </div>
  );
}
