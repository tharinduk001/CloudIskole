import { CheckCircle2, Clock, Lock, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  EnrollFreeButton,
  StartCheckoutButton,
} from "@/components/courses/enroll-button";
import { Liyawel } from "@/components/brand/liyawel";
import { StartQuizButton } from "@/components/quizzes/start-quiz-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { getOptionalProfile } from "@/lib/data/auth";
import {
  flattenLessons,
  getCourseOutline,
  getEnrollment,
  getLessonProgressMap,
} from "@/lib/data/courses";
import { formatDuration, formatLevel, formatLkr } from "@/lib/format";
import { listMyAttempts, listQuizzesForCourse } from "@/lib/data/quizzes";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseOutline(slug);
  return {
    title: course.title,
    description: course.subtitle ?? course.description ?? undefined,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseOutline(slug);
  const profile = await getOptionalProfile();

  const enrollment = profile ? await getEnrollment(course.id, profile.id) : null;
  const isEnrolled =
    enrollment?.status === "active" || enrollment?.status === "completed";

  const progress =
    profile && isEnrolled
      ? await getLessonProgressMap(course.id, profile.id)
      : new Map<string, { completed_at: string | null }>();

  const lessons = flattenLessons(course.modules);
  const firstLesson = lessons[0];
  const nextLesson = isEnrolled
    ? (lessons.find((l) => !progress.get(l.id)?.completed_at) ?? firstLesson)
    : firstLesson;

  const totalSeconds = lessons.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
  const totalDuration = formatDuration(totalSeconds);

  const courseQuizzes = isEnrolled ? await listQuizzesForCourse(course.id) : [];
  const quizzesWithAttempts = await Promise.all(
    courseQuizzes.map(async (quiz) => ({
      quiz,
      attempts: await listMyAttempts(quiz.id),
    })),
  );

  return (
    <>
      <section className="bg-wash border-line relative overflow-hidden border-b">
        <Liyawel className="absolute -top-24 -right-28 size-96 opacity-[0.05]" />
        <Container size="wide" className="relative py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={course.is_free ? "success" : "teal"}>
                  {course.is_free ? "Free course" : formatLkr(course.price_cents)}
                </Badge>
                <Badge variant="neutral">{formatLevel(course.level)}</Badge>
                {course.category ? (
                  <Badge variant="neutral">{course.category}</Badge>
                ) : null}
              </div>

              <h1 className="font-display mt-4 text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">
                {course.title}
              </h1>

              {course.subtitle ? (
                <p className="text-ink-muted mt-4 max-w-2xl text-lg leading-relaxed">
                  {course.subtitle}
                </p>
              ) : null}

              <div className="text-ink-subtle mt-6 flex flex-wrap items-center gap-5 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <PlayCircle className="size-4" aria-hidden="true" />
                  {lessons.length} lessons
                </span>
                {totalDuration ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" />
                    {totalDuration} total
                  </span>
                ) : null}
              </div>
            </div>

            <Card className="p-6">
              {isEnrolled ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">Your progress</span>
                    <span className="font-semibold text-teal-700">
                      {enrollment?.progress_pct ?? 0}%
                    </span>
                  </div>
                  <div className="bg-line mt-2 h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
                      style={{ width: `${enrollment?.progress_pct ?? 0}%` }}
                    />
                  </div>
                  <Button asChild size="lg" className="mt-5 w-full">
                    <Link href={lessonHref(course.slug, nextLesson)}>
                      {enrollment?.status === "completed"
                        ? "Review course"
                        : "Continue learning"}
                    </Link>
                  </Button>
                </>
              ) : !profile ? (
                <div className="flex flex-col gap-3">
                  <p className="text-ink-muted text-sm leading-relaxed">
                    Sign in or create a free account to enrol.
                  </p>
                  <Button asChild size="lg">
                    <Link
                      href={`/sign-in?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
                    >
                      Sign in to enrol
                    </Link>
                  </Button>
                </div>
              ) : course.is_free ? (
                <EnrollFreeButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  firstLessonHref={lessonHref(course.slug, firstLesson)}
                />
              ) : (
                <StartCheckoutButton courseId={course.id} />
              )}
            </Card>
          </div>
        </Container>
      </section>

      <Section>
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            {course.description ? (
              <div>
                <h2 className="font-display text-xl font-semibold">About this course</h2>
                <p className="text-ink-muted mt-4 text-[0.95rem] leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            ) : (
              <div />
            )}

            <div>
              <h2 className="font-display text-xl font-semibold">Course content</h2>
              <div className="mt-5 flex flex-col gap-5">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
                      Module {moduleIndex + 1} · {module.title}
                    </h3>
                    <ul className="border-line bg-surface mt-3 divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border">
                      {module.lessons.map((lesson) => {
                        const locked = !isEnrolled && !lesson.is_preview;
                        const completed = Boolean(progress.get(lesson.id)?.completed_at);
                        const duration = formatDuration(lesson.duration_seconds);

                        const content = (
                          <div className="flex items-center gap-3 px-4 py-3.5">
                            {completed ? (
                              <CheckCircle2
                                className="size-4.5 shrink-0 text-teal-600"
                                aria-hidden="true"
                              />
                            ) : locked ? (
                              <Lock
                                className="text-ink-subtle size-4.5 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <PlayCircle
                                className="text-ink-subtle size-4.5 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={cn(
                                "flex-1 text-sm",
                                locked ? "text-ink-subtle" : "text-ink",
                              )}
                            >
                              {lesson.title}
                            </span>
                            {lesson.is_preview && !isEnrolled ? (
                              <Badge variant="gold" size="sm">
                                Preview
                              </Badge>
                            ) : null}
                            {duration ? (
                              <span className="text-ink-subtle text-xs">{duration}</span>
                            ) : null}
                          </div>
                        );

                        return (
                          <li key={lesson.id}>
                            {locked ? (
                              content
                            ) : (
                              <Link
                                href={`/courses/${course.slug}/${lesson.slug}`}
                                className="block transition-colors hover:bg-teal-50/60"
                              >
                                {content}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                {course.modules.length === 0 ? (
                  <p className="text-ink-muted text-sm">
                    Lessons for this course are being finalised.
                  </p>
                ) : null}
              </div>

              {quizzesWithAttempts.length > 0 ? (
                <div className="mt-8">
                  <h2 className="font-display text-xl font-semibold">Course quizzes</h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {quizzesWithAttempts.map(({ quiz, attempts }) => {
                      const submitted = attempts.filter((a) => a.submitted_at);
                      const best = submitted.reduce<number | null>(
                        (max, a) => (a.score_pct != null && (max === null || a.score_pct > max) ? a.score_pct : max),
                        null,
                      );
                      const anyPassed = submitted.some((a) => a.passed);
                      const attemptsLeft = quiz.max_attempts ? quiz.max_attempts - attempts.length : null;
                      const outOfAttempts = attemptsLeft !== null && attemptsLeft <= 0;

                      return (
                        <Card key={quiz.id} className="flex items-center justify-between gap-4 p-4">
                          <div>
                            <p className="text-ink text-sm font-medium">{quiz.title}</p>
                            {best !== null ? (
                              <p className="text-ink-muted mt-0.5 text-xs">
                                Best score {best}%
                                {anyPassed ? (
                                  <Badge variant="success" size="sm" className="ml-2">
                                    Passed
                                  </Badge>
                                ) : null}
                              </p>
                            ) : (
                              <p className="text-ink-subtle mt-0.5 text-xs">
                                Pass at {quiz.pass_mark_pct}%
                              </p>
                            )}
                          </div>
                          {outOfAttempts ? (
                            <span className="text-ink-subtle text-xs">No attempts left</span>
                          ) : (
                            <StartQuizButton
                              quizId={quiz.id}
                              returnTo={`/courses/${course.slug}`}
                              label={submitted.length > 0 ? "Retake" : "Start quiz"}
                              size="sm"
                            />
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function lessonHref(courseSlug: string, lesson: { slug: string } | undefined): string {
  return lesson ? `/courses/${courseSlug}/${lesson.slug}` : `/courses/${courseSlug}`;
}
