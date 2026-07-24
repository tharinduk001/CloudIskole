import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Coins,
  Flame,
  Radio,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { requireProfile } from "@/lib/data/auth";
import { getNextLesson, listMyEnrollments } from "@/lib/data/courses";
import { getMyGamification } from "@/lib/data/gamification";
import { listMyRegistrations } from "@/lib/data/sessions";
import { formatLevel } from "@/lib/format";

const sessionDateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const firstName = (profile.full_name || profile.email).split(/[\s@]/)[0] ?? "there";

  const enrollments = await listMyEnrollments(profile.id);
  const nextLessons = await Promise.all(
    enrollments.map(async ({ course, enrollment }) => ({
      courseId: course.id,
      lesson:
        enrollment.status === "completed"
          ? null
          : await getNextLesson(course.id, profile.id),
    })),
  );
  const nextLessonByCourse = new Map(nextLessons.map((n) => [n.courseId, n.lesson]));

  const myRegistrations = await listMyRegistrations();
  const upcomingSessions = myRegistrations
    .filter((r) => r.session.status === "upcoming" || r.session.status === "live")
    .sort((a, b) => a.session.starts_at.localeCompare(b.session.starts_at))
    .slice(0, 3);

  const gamification = await getMyGamification(profile.id);

  return (
    <Section className="py-12">
      <Container size="wide">
        <h1 className="font-display text-3xl sm:text-4xl">Welcome, {firstName}.</h1>
        <p className="text-ink-muted mt-3 text-base">
          {enrollments.length > 0
            ? "Pick up where you left off, or explore something new."
            : "Your courses, sessions and results will appear here as you go."}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-3 p-5">
            <span className="bg-gold-50 text-gold-600 grid size-11 shrink-0 place-items-center rounded-xl">
              <Coins className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold">
                {gamification.totalCoins}
              </p>
              <p className="text-ink-muted text-xs">CloudCoins</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-5">
            <span className="bg-gold-50 text-gold-700 grid size-11 shrink-0 place-items-center rounded-xl">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold">{gamification.streak}</p>
              <p className="text-ink-muted text-xs">Day streak</p>
            </div>
          </Card>
          <Link href="/profile#badges">
            <Card interactive className="flex h-full items-center gap-3 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <Award className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold">
                  {gamification.badges.length}
                </p>
                <p className="text-ink-muted text-xs">Badges earned</p>
              </div>
            </Card>
          </Link>
        </div>

        {enrollments.length > 0 ? (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">My courses</h2>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline"
              >
                Browse more
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map(({ course, enrollment }) => {
                const nextLesson = nextLessonByCourse.get(course.id);
                const isCompleted = enrollment.status === "completed";
                const href = nextLesson
                  ? `/courses/${course.slug}/${nextLesson.slug}`
                  : `/courses/${course.slug}`;

                return (
                  <Card key={enrollment.id} className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant={isCompleted ? "success" : "teal"} size="sm">
                        {isCompleted ? "Completed" : formatLevel(course.level)}
                      </Badge>
                    </div>
                    <h3 className="font-display mt-3 line-clamp-2 text-base font-semibold">
                      {course.title}
                    </h3>

                    <div className="mt-4">
                      <div className="text-ink-muted flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span className="font-medium">{enrollment.progress_pct}%</span>
                      </div>
                      <div className="bg-line mt-1.5 h-1.5 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${enrollment.progress_pct}%` }}
                        />
                      </div>
                    </div>

                    <Button asChild size="sm" variant="secondary" className="mt-5">
                      <Link href={href}>
                        {isCompleted ? "Review course" : "Continue"}
                      </Link>
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}

        {upcomingSessions.length > 0 ? (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">My sessions</h2>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline"
              >
                See all
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingSessions.map(({ session }) => (
                <Link key={session.id} href={`/sessions/${session.slug}`}>
                  <Card interactive className="flex h-full flex-col p-6">
                    {session.status === "live" ? (
                      <Badge variant="danger" size="sm">
                        <Radio aria-hidden="true" />
                        Live now
                      </Badge>
                    ) : null}
                    <h3 className="font-display mt-3 line-clamp-2 text-base font-semibold">
                      {session.title}
                    </h3>
                    <p className="text-ink-subtle mt-auto pt-4 text-xs">
                      {sessionDateFormatter.format(new Date(session.starts_at))}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {enrollments.length === 0 && upcomingSessions.length === 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <Card className="p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-display mt-4 text-lg font-semibold">My courses</h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                You have not enrolled in a course yet. The first tracks are open now.
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
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
