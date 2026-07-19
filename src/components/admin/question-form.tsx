"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertQuestion } from "@/lib/admin/quizzes-actions";

/** Adds a new question to the quiz. Options are added afterwards on the question itself. */
export function QuestionForm({ quizId }: { quizId: string }) {
  const [state, action, pending] = useActionState(upsertQuestion, idleResult);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="border-line flex flex-wrap items-end gap-3 rounded-xl border border-dashed p-4"
    >
      <input type="hidden" name="quizId" value={quizId} />
      <Field label="New question" className="min-w-48 flex-1">
        {(props) => <Textarea {...props} name="body" required rows={2} placeholder="Question text" />}
      </Field>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
        Add question
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger w-full text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
