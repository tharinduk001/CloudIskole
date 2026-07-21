"use client";

import { CheckCircle2, Circle, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { OptionForm } from "@/components/admin/option-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import {
  deleteOption,
  deleteQuestion,
  upsertQuestion,
} from "@/lib/admin/quizzes-actions";
import type { AdminQuestion } from "@/lib/data/admin";

export function QuestionEditor({
  quizId,
  question,
  index,
}: {
  quizId: string;
  question: AdminQuestion;
  index: number;
}) {
  const [state, action, pending] = useActionState(upsertQuestion, idleResult);
  const [addingOption, setAddingOption] = React.useState(false);
  const [editingOptionId, setEditingOptionId] = React.useState<string | null>(null);

  const hasCorrectOption = question.quiz_options.some((o) => o.is_correct);

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-ink-subtle text-xs font-semibold tracking-wide uppercase">
          Question {index + 1}
        </span>
        <ConfirmDeleteButton
          label="Delete question"
          confirmMessage="Delete this question and its options?"
          onDelete={() => deleteQuestion(question.id, quizId)}
        />
      </div>

      <form action={action} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="id" value={question.id} />
        <input type="hidden" name="quizId" value={quizId} />
        <Field label="Question">
          {(props) => (
            <Textarea
              {...props}
              name="body"
              rows={2}
              required
              defaultValue={question.body}
            />
          )}
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Explanation"
            className="sm:col-span-2"
            hint="Shown after the student submits"
          >
            {(props) => (
              <Input
                {...props}
                name="explanation"
                defaultValue={question.explanation ?? ""}
              />
            )}
          </Field>
          <Field label="Points">
            {(props) => (
              <Input
                {...props}
                name="points"
                type="number"
                defaultValue={question.points}
              />
            )}
          </Field>
        </div>
        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save question
        </Button>
        {state.status === "error" ? (
          <p className="text-danger text-xs">{state.message}</p>
        ) : null}
      </form>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-xs font-medium">Options</span>
          {!hasCorrectOption && question.quiz_options.length > 0 ? (
            <span className="text-danger text-xs">No correct option marked yet</span>
          ) : null}
        </div>
        <ul className="border-line mt-2 divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border">
          {question.quiz_options.map((option) =>
            editingOptionId === option.id ? (
              <li key={option.id} className="p-3">
                <OptionForm
                  quizId={quizId}
                  questionId={question.id}
                  option={option}
                  onDone={() => setEditingOptionId(null)}
                />
              </li>
            ) : (
              <li key={option.id} className="flex items-center gap-3 px-4 py-2.5">
                {option.is_correct ? (
                  <CheckCircle2
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="text-ink-subtle size-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setEditingOptionId(option.id)}
                  className="flex-1 text-left text-sm text-teal-700 hover:underline"
                >
                  {option.body}
                </button>
                <ConfirmDeleteButton
                  label="Delete option"
                  confirmMessage="Delete this option?"
                  onDelete={() => deleteOption(option.id, quizId)}
                />
              </li>
            ),
          )}
          {question.quiz_options.length === 0 ? (
            <li className="text-ink-muted px-4 py-2.5 text-xs">No options yet.</li>
          ) : null}
        </ul>
        <div className="mt-2">
          {addingOption ? (
            <OptionForm
              quizId={quizId}
              questionId={question.id}
              onDone={() => setAddingOption(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingOption(true)}
              className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add option
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
