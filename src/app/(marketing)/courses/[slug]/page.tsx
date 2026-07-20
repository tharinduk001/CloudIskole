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
      <section className="bg-cream border-hairline relative overflow-hidden border-b">
        <Liyawel
          strokeClassName="stroke-onyx"
          className="absolute -top-24 -right-28 size-96 opacity-[0.05]"
        />
        <Container size="wide" className="relative py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    "rounded-none border-0",
                    course.is_free ? "bg-mint-500/15 text-mint-500" : "bg-onyx/10 text-onyx",
                  )}
                >
                  {course.is_free ? "Free course" : formatLkr(course.price_cents)}
                </Badge>
                <Badge className="bg-hairline/60 text-onyx-soft rounded-none border-0">
                  {formatLevel(course.level)}
                </Badge>
                {course.category ? (
                  <Badge className="bg-hairline/60 text-onyx-soft rounded-none border-0">
                    {course.category}
                  </Badge>
                ) : null}
              </div>

              <h1 className="font-display text-onyx mt-4 text-4xl leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                {course.title}
              </h1>

              {course.subtitle ? (
                <p className="text-mist mt-4 max-w-2xl text-lg leading-relaxed">
                  {course.subtitle}
                </p>
              ) : null}

              <div className="text-mist-soft mt-6 flex flex-wrap items-center gap-5 text-sm">
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

            <Card className="border-hairline rounded-none p-6">
              {isEnrolled ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-mist">Your progress</span>
                    <span className="text-terracotta-600 font-semibold">
                      {enrollment?.progress_pct ?? 0}%
                    </span>
                  </div>
                  <div className="bg-hairline mt-2 h-2 overflow-hidden">
                    <div
                      className="bg-terracotta-600 h-full transition-[width] duration-300"
                      style={{ width: `${enrollment?.progress_pct ?? 0}%` }}
                    />
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-terracotta-600 hover:bg-terracotta-700 mt-5 w-full rounded-none"
                  >
                    <Link href={lessonHref(course.slug, nextLesson)}>
                      {enrollment?.status === "completed"
                        ? "Review course"
                        : "Continue learning"}
                    </Link>
                  </Button>
                </>
              ) : !profile ? (
                <div className="flex flex-col gap-3">
                  <p className="text-mist text-sm leading-relaxed">
                    Sign in or create a free account to enrol.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="bg-terracotta-600 hover:bg-terracotta-700 rounded-none"
                  >
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

      <Section className="bg-cream">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            {course.description ? (
              <div>
                <h2 className="font-display text-onyx text-xl font-semibold">
                  About this course
                </h2>
                <p className="text-mist mt-4 text-[0.95rem] leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            ) : (
              <div />
            )}

            <div>
              <h2 className="font-display text-onyx text-xl font-semibold">
                Course content
              </h2>
              <div className="mt-5 flex flex-col gap-5">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <h3 className="text-mist text-xs font-semibold tracking-wide uppercase">
                      Module {moduleIndex + 1} · {module.title}
                    </h3>
                    <ul className="border-hairline bg-surface mt-3 divide-y divide-[var(--color-hairline)] overflow-hidden border">
                      {module.lessons.map((lesson) => {
                        const locked = !isEnrolled && !lesson.is_preview;
                        const completed = Boolean(progress.get(lesson.id)?.completed_at);
                        const duration = formatDuration(lesson.duration_seconds);

                        const content = (
                          <div className="flex items-center gap-3 px-4 py-3.5">
                            {completed ? (
                              <CheckCircle2
                                className="text-terracotta-600 size-4.5 shrink-0"
                                aria-hidden="true"
                              />
                            ) : locked ? (
                              <Lock
                                className="text-mist-soft size-4.5 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <PlayCircle
                                className="text-mist-soft size-4.5 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={cn(
                                "flex-1 text-sm",
                                locked ? "text-mist-soft" : "text-onyx",
                              )}
                            >
                              {lesson.title}
                            </span>
                            {lesson.is_preview && !isEnrolled ? (
                              <Badge
                                className="bg-terracotta-50 text-terracotta-600 rounded-none border-0"
                                size="sm"
                              >
                                Preview
                              </Badge>
                            ) : null}
                            {duration ? (
                              <span className="text-mist-soft text-xs">{duration}</span>
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
                                className="hover:bg-terracotta-50/60 block transition-colors"
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
                  <p className="text-mist text-sm">
                    Lessons for this course are being finalised.
                  </p>
                ) : null}
              </div>

              {quizzesWithAttempts.length > 0 ? (
                <div className="mt-8">
                  <h2 className="font-display text-onyx text-xl font-semibold">
                    Course quizzes
                  </h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {quizzesWithAttempts.map(({ quiz, attempts }) => {
                      const submitted = attempts.filter((a) => a.submitted_at);
                      const best = submitted.reduce<number | null>(
                        (max, a) =>
                          a.score_pct != null && (max === null || a.score_pct > max)
                            ? a.score_pct
                            : max,
                        null,
                      );
                      const anyPassed = submitted.some((a) => a.passed);
                      const attemptsLeft = quiz.max_attempts
                        ? quiz.max_attempts - attempts.length
                        : null;
                      const outOfAttempts = attemptsLeft !== null && attemptsLeft <= 0;

                      return (
                        <Card
                          key={quiz.id}
                          className="border-hairline flex items-center justify-between gap-4 rounded-none p-4"
                        >
                          <div>
                            <p className="text-onyx text-sm font-medium">{quiz.title}</p>
                            {best !== null ? (
                              <p className="text-mist mt-0.5 text-xs">
                                Best score {best}%
                                {anyPassed ? (
                                  <Badge
                                    className="bg-mint-500/15 text-mint-500 ml-2 rounded-none border-0"
                                    size="sm"
                                  >
                                    Passed
                                  </Badge>
                                ) : null}
                              </p>
                            ) : (
                              <p className="text-mist-soft mt-0.5 text-xs">
                                Pass at {quiz.pass_mark_pct}%
                              </p>
                            )}
                          </div>
                          {outOfAttempts ? (
                            <span className="text-mist-soft text-xs">
                              No attempts left
                            </span>
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
