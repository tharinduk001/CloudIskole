"use client";

import { Clock, Loader2 } from "lucide-react";
import * as React from "react";

import { QuizResultView } from "@/components/quizzes/quiz-result-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitQuizAttempt } from "@/lib/quizzes/actions";
import type { QuizPaper, QuizResult } from "@/lib/data/quizzes";

type Answers = Record<string, string>;

function storageKey(attemptId: string) {
  return `cloudiskole:quiz-attempt:${attemptId}`;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Runs a quiz attempt: question navigation, an optional countdown that
 * mirrors the server-enforced `expires_at` (the server re-checks the clock
 * at submission regardless — this timer is UX, not the actual boundary),
 * answers autosaved to `localStorage` so a refresh doesn't lose progress,
 * and server-side grading on submit.
 */
export function QuizRunner({
  attemptId,
  paper,
  expiresAt,
}: {
  attemptId: string;
  paper: QuizPaper;
  expiresAt: string | null;
}) {
  // Lazy initializers run once, outside the render body's purity rules — the
  // right place for a one-time read of an external, client-only source like
  // localStorage or the wall clock. Each attempt has its own page/mount, so
  // "once per mount" is exactly "once per attempt" here.
  const [answers, setAnswers] = React.useState<Answers>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(storageKey(attemptId));
      return raw ? (JSON.parse(raw) as Answers) : {};
    } catch {
      return {};
    }
  });
  const [index, setIndex] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<QuizResult | null>(null);
  const [remainingMs, setRemainingMs] = React.useState<number | null>(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : null,
  );

  const submit = React.useCallback(
    async (finalAnswers: Answers) => {
      setSubmitting(true);
      setError(null);
      const res = await submitQuizAttempt(attemptId, finalAnswers);
      setSubmitting(false);
      if (res.status === "error") {
        setError(res.message);
        return;
      }
      window.localStorage.removeItem(storageKey(attemptId));
      setResult(res.result);
    },
    [attemptId],
  );

  React.useEffect(() => {
    if (!expiresAt || result) return;
    const timer = setInterval(() => {
      const left = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(timer);
        void submit(answers);
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, result]);

  function choose(questionId: string, optionId: string) {
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);
    window.localStorage.setItem(storageKey(attemptId), JSON.stringify(next));
  }

  if (result) return <QuizResultView result={result} />;

  const question = paper.questions[index];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-ink-muted text-sm">
          Question {index + 1} of {paper.questions.length} &middot; {answeredCount} answered
        </p>
        {remainingMs !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium",
              remainingMs < 60_000 ? "text-danger" : "text-ink-muted",
            )}
          >
            <Clock className="size-4" aria-hidden="true" />
            {formatRemaining(remainingMs)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {paper.questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-medium",
              i === index
                ? "bg-teal-600 text-white"
                : answers[q.id]
                  ? "bg-teal-50 text-teal-700"
                  : "border-line-strong text-ink-muted border",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {question ? (
        <Card className="p-6">
          <p className="text-ink text-base font-medium">{question.body}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "border-line-strong flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                  answers[question.id] === option.id
                    ? "border-teal-500 bg-teal-50/60"
                    : "hover:bg-paper",
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  className="accent-teal-600"
                  checked={answers[question.id] === option.id}
                  onChange={() => choose(question.id, option.id)}
                />
                {option.body}
              </label>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>

        {index < paper.questions.length - 1 ? (
          <Button type="button" onClick={() => setIndex((i) => Math.min(paper.questions.length - 1, i + 1))}>
            Next
          </Button>
        ) : (
          <Button type="button" disabled={submitting} onClick={() => void submit(answers)}>
            {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Submit exam
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
