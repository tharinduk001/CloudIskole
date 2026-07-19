"use client";

import { Loader2, PlayCircle } from "lucide-react";
import { useActionState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { idleResult } from "@/lib/actions/result";
import { startQuizAttempt } from "@/lib/quizzes/actions";

export function StartQuizButton({
  quizId,
  returnTo,
  label = "Start exam",
  size = "lg",
}: {
  quizId: string;
  returnTo: string;
  label?: string;
  size?: ButtonProps["size"];
}) {
  const [state, action, pending] = useActionState(startQuizAttempt, idleResult);

  return (
    <form action={action} className="flex flex-col gap-2 sm:items-start">
      <input type="hidden" name="quizId" value={quizId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button type="submit" size={size} disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <PlayCircle aria-hidden="true" />}
        {label}
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
