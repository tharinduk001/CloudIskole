import { ArrowRight, BookOpen, CalendarDays, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { requireProfile } from "@/lib/data/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const firstName = (profile.full_name || profile.email).split(/[\s@]/)[0] ?? "there";

  return (
    <Section className="py-12">
      <Container size="wide">
        <h1 className="font-display text-3xl sm:text-4xl">Welcome, {firstName}.</h1>
        <p className="text-ink-muted mt-3 text-base">
          Your courses, sessions and results will appear here as you go.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-display mt-4 text-lg font-semibold">My courses</h2>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              You have not enrolled in a course yet. The first tracks open soon.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-5">
              <Link href="/courses">
                Browse courses
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Card>

          <Card className="p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-display mt-4 text-lg font-semibold">Live sessions</h2>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              No sessions scheduled yet. We will notify you when the first one opens.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-5">
              <Link href="/sessions">
                See sessions
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Card>

          <Card className="p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-display mt-4 text-lg font-semibold">Your XP</h2>
            <p className="font-display mt-3 text-3xl font-semibold text-teal-600">0</p>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              Earn XP by finishing lessons, passing quizzes and attending sessions.
            </p>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
