import type { Metadata } from "next";

import { QuizResultView } from "@/components/quizzes/quiz-result-view";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { Container, Section } from "@/components/ui/layout";
import {
  getAttempt,
  getAttemptResult,
  getQuizById,
  getQuizPaper,
} from "@/lib/data/quizzes";

export const metadata: Metadata = { title: "Quiz attempt" };

export default async function QuizAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId);
  const quiz = await getQuizById(attempt.quiz_id);

  return (
    <Section className="py-10 sm:py-14">
      <Container size="narrow" className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold">{quiz?.title ?? "Quiz"}</h1>

        <div className="mt-6">
          {attempt.submitted_at ? (
            <QuizResultView result={await getAttemptResult(attemptId)} />
          ) : (
            <QuizRunner
              attemptId={attempt.id}
              paper={await getQuizPaper(attempt.quiz_id)}
              expiresAt={attempt.expires_at}
            />
          )}
        </div>
      </Container>
    </Section>
  );
}
