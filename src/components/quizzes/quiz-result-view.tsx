import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuizResult } from "@/lib/data/quizzes";

/** Score summary and per-question explanations, shown once an attempt is graded. */
export function QuizResultView({ result }: { result: QuizResult }) {
  return (
    <div className="flex flex-col gap-6">
      <Card className={cn("p-6 text-center", result.passed ? "border-success/30" : "border-danger/30")}>
        {result.passed ? (
          <CheckCircle2 className="text-success mx-auto size-9" aria-hidden="true" />
        ) : (
          <XCircle className="text-danger mx-auto size-9" aria-hidden="true" />
        )}
        <p className="text-ink mt-3 text-3xl font-semibold">{result.score_pct}%</p>
        <p className="text-ink-muted mt-1 text-sm">
          {result.score_points} / {result.total_points} points &middot; pass mark {result.pass_mark_pct}%
        </p>
        <Badge variant={result.passed ? "success" : "danger"} className="mt-3">
          {result.passed ? "Passed" : "Not passed"}
        </Badge>
      </Card>

      <div className="flex flex-col gap-4">
        {result.questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-start gap-3">
              {q.is_correct ? (
                <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="text-danger mt-0.5 size-5 shrink-0" aria-hidden="true" />
              )}
              <div className="flex-1">
                <p className="text-ink text-sm font-medium">
                  {i + 1}. {q.body}
                </p>
                {q.explanation ? (
                  <p className="text-ink-muted mt-2 text-sm leading-relaxed">{q.explanation}</p>
                ) : null}
                {!q.chosen_option_id ? (
                  <p className="text-ink-subtle mt-2 text-xs">You left this question unanswered.</p>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
