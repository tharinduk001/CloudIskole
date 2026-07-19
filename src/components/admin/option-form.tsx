"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertOption } from "@/lib/admin/quizzes-actions";
import type { Database } from "@/lib/supabase/database.types";

type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];

export function OptionForm({
  quizId,
  questionId,
  option,
  onDone,
}: {
  quizId: string;
  questionId: string;
  option?: OptionRow;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertOption, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      {option ? <input type="hidden" name="id" value={option.id} /> : null}
      <input type="hidden" name="quizId" value={quizId} />
      <input type="hidden" name="questionId" value={questionId} />

      <Field label="Option text" className="min-w-40 flex-1">
        {(props) => <Input {...props} name="body" required defaultValue={option?.body} />}
      </Field>
      <CheckboxField name="isCorrect" label="Correct" defaultChecked={option?.is_correct ?? false} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Save
      </Button>
      {onDone ? (
        <button type="button" onClick={onDone} className="text-ink-subtle text-xs hover:underline">
          Cancel
        </button>
      ) : null}
      {state.status === "error" ? <span className="text-danger text-xs">{state.message}</span> : null}
    </form>
  );
}
