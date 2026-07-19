import { Clock, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { listExams } from "@/lib/data/quizzes";

export const metadata: Metadata = {
  title: "Practice exams",
  description:
    "Timed MCQ practice exams in Cloud, DevOps and Linux with instant marking, answer explanations and rankings.",
};

export default async function ExamsPage() {
  const exams = await listExams();

  return (
    <>
      <PageHeader
        eyebrow="Test yourself"
        title="Practice exams"
        description="Timed multiple-choice exams with instant marking and explanations for every answer."
      />

      <Section>
        <Container size="wide">
          {exams.length === 0 ? (
            <p className="text-ink-muted text-sm">
              No exams are open yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.slug}`}>
                  <Card interactive className="flex h-full flex-col p-6">
                    <h2 className="font-display text-lg font-semibold">{exam.title}</h2>
                    {exam.description ? (
                      <p className="text-ink-muted mt-2 line-clamp-3 text-sm leading-relaxed">
                        {exam.description}
                      </p>
                    ) : null}
                    <div className="text-ink-subtle mt-auto flex items-center gap-4 pt-5 text-xs">
                      {exam.time_limit_minutes ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" aria-hidden="true" />
                          {exam.time_limit_minutes} min
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="size-3.5" aria-hidden="true" />
                        Pass at {exam.pass_mark_pct}%
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
