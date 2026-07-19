import { CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";
import type { Metadata } from "next";

import { StartQuizButton } from "@/components/quizzes/start-quiz-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { getOptionalProfile } from "@/lib/data/auth";
import { getQuizBySlug, listMyAttempts } from "@/lib/data/quizzes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  return { title: quiz.title, description: quiz.description ?? undefined };
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  const profile = await getOptionalProfile();
  const attempts = profile ? await listMyAttempts(quiz.id) : [];
  const submitted = attempts.filter((a) => a.submitted_at);
  const attemptsUsed = attempts.length;
  const attemptsLeft = quiz.max_attempts ? quiz.max_attempts - attemptsUsed : null;
  const outOfAttempts = attemptsLeft !== null && attemptsLeft <= 0;

  return (
    <Section className="py-10 sm:py-16">
      <Container size="narrow" className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">{quiz.title}</h1>
        {quiz.description ? (
          <p className="text-ink-muted mt-3 text-base leading-relaxed">
            {quiz.description}
          </p>
        ) : null}

        <div className="text-ink-subtle mt-5 flex flex-wrap items-center gap-5 text-sm">
          {quiz.time_limit_minutes ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {quiz.time_limit_minutes} minutes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              Untimed
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-4" aria-hidden="true" />
            Pass at {quiz.pass_mark_pct}%
          </span>
          {quiz.max_attempts ? <span>{quiz.max_attempts} attempts allowed</span> : null}
        </div>

        <div className="mt-8">
          {!profile ? (
            <a
              href={`/sign-in?next=${encodeURIComponent(`/exams/${quiz.slug}`)}`}
              className="text-sm font-medium text-teal-600 hover:underline"
            >
              Sign in to take this exam
            </a>
          ) : outOfAttempts ? (
            <p className="text-ink-muted text-sm">
              You have used all {quiz.max_attempts} attempts for this exam.
            </p>
          ) : (
            <StartQuizButton
              quizId={quiz.id}
              returnTo={`/exams/${quiz.slug}`}
              label={submitted.length > 0 ? "Retake exam" : "Start exam"}
            />
          )}
        </div>

        {submitted.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-ink text-sm font-semibold">Your attempts</h2>
            <div className="mt-3 flex flex-col gap-2">
              {submitted.map((attempt) => (
                <Card
                  key={attempt.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-ink-muted text-sm">
                    Attempt {attempt.attempt_no}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-ink text-sm font-medium">
                      {attempt.score_pct}%
                    </span>
                    <Badge variant={attempt.passed ? "success" : "danger"} size="sm">
                      {attempt.passed ? (
                        <>
                          <CheckCircle2 aria-hidden="true" /> Passed
                        </>
                      ) : (
                        <>
                          <XCircle aria-hidden="true" /> Not passed
                        </>
                      )}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
