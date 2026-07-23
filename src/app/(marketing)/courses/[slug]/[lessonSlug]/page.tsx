import { CheckCircle2, ChevronLeft, ChevronRight, Lock, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LessonMarkdown } from "@/components/lesson/lesson-markdown";
import { MarkCompleteButton } from "@/components/lesson/mark-complete-button";
import { SecureVideoPlayer } from "@/components/video/secure-video-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/layout";
import { getOptionalProfile } from "@/lib/data/auth";
import {
  flattenLessons,
  getLessonForViewer,
  getLessonProgressMap,
} from "@/lib/data/courses";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const { course, lesson } = await getLessonForViewer(slug, lessonSlug);
  return { title: `${lesson.title} · ${course.title}` };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const { course, lesson, outline } = await getLessonForViewer(slug, lessonSlug);
  const profile = await getOptionalProfile();

  const lessons = flattenLessons(outline);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = index > 0 ? lessons[index - 1] : undefined;
  const nextLesson =
    index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;

  const progress = profile
    ? await getLessonProgressMap(course.id, profile.id)
    : new Map<string, { completed_at: string | null }>();
  const isCompleted = Boolean(progress.get(lesson.id)?.completed_at);

  // Reaching this page at all means RLS already allowed it: either the
  // lesson is a free preview, or the caller is enrolled. Progress tracking
  // and the mark-complete control require an actual enrollment, though —
  // a signed-in visitor browsing a preview lesson has neither.
  const canTrackProgress =
    profile !== null &&
    (lesson.is_preview ? await hasEnrollment(course.id, profile.id) : true);

  let assetUrl: string | null = null;
  if (lesson.type === "pdf" && lesson.attachment_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("course-assets")
      .createSignedUrl(lesson.attachment_path, 60 * 30);
    assetUrl = data?.signedUrl ?? null;
  }

  return (
    <Section className="py-8 sm:py-10">
      <Container size="wide">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <Link
                href={`/courses/${course.slug}`}
                className="text-ink-muted mb-4 inline-flex items-center gap-1.5 text-sm hover:text-teal-700"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                {course.title}
              </Link>

              <nav
                aria-label="Course content"
                className="border-line bg-surface max-h-[70vh] overflow-y-auto rounded-2xl border p-3"
              >
                {outline.map((module) => (
                  <div key={module.id} className="mb-2 last:mb-0">
                    <p className="text-ink-subtle px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
                      {module.title}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {module.lessons.map((l) => {
                        const active = l.id === lesson.id;
                        const done = Boolean(progress.get(l.id)?.completed_at);
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/courses/${course.slug}/${l.slug}`}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm",
                                active
                                  ? "bg-teal-50 font-medium text-teal-700"
                                  : "text-ink-muted hover:bg-paper",
                              )}
                            >
                              {done ? (
                                <CheckCircle2
                                  className="size-4 shrink-0 text-teal-600"
                                  aria-hidden="true"
                                />
                              ) : (
                                <PlayCircle
                                  className="text-ink-subtle size-4 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <span className="line-clamp-1">{l.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <div className="order-1 lg:order-2">
            <div className="flex flex-wrap items-center gap-2">
              {lesson.is_preview ? <Badge variant="gold">Free preview</Badge> : null}
            </div>
            <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
              {lesson.title}
            </h1>

            <div className="mt-6">
              {lesson.type === "video" && lesson.youtube_id ? (
                <SecureVideoPlayer youtubeId={lesson.youtube_id} title={lesson.title} />
              ) : null}

              {lesson.type === "text" && lesson.content_mdx ? (
                <LessonMarkdown content={lesson.content_mdx} />
              ) : null}

              {lesson.type === "pdf" ? (
                <div className="border-line bg-surface flex flex-col items-center gap-4 rounded-2xl border px-6 py-12 text-center">
                  <Lock className="text-ink-subtle size-8" aria-hidden="true" />
                  <p className="text-ink-muted text-sm">
                    This lesson is a downloadable PDF.
                  </p>
                  {assetUrl ? (
                    <Button asChild>
                      <a href={assetUrl} target="_blank" rel="noopener noreferrer">
                        Open PDF
                      </a>
                    </Button>
                  ) : (
                    <p className="text-danger text-xs">
                      This file could not be prepared right now. Please refresh.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-line mt-10 flex flex-col gap-6 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 flex justify-between gap-3 sm:order-1">
                {prevLesson ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/courses/${course.slug}/${prevLesson.slug}`}>
                      <ChevronLeft aria-hidden="true" />
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {nextLesson ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/courses/${course.slug}/${nextLesson.slug}`}>
                      Next
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </Button>
                ) : null}
              </div>

              <div className="order-1 sm:order-2">
                {canTrackProgress ? (
                  <MarkCompleteButton
                    lessonId={lesson.id}
                    courseId={course.id}
                    courseSlug={course.slug}
                    initiallyCompleted={isCompleted}
                  />
                ) : !profile ? (
                  <Button asChild variant="secondary">
                    <Link
                      href={`/sign-in?next=${encodeURIComponent(`/courses/${course.slug}/${lesson.slug}`)}`}
                    >
                      Sign in to track progress
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={`/courses/${course.slug}`}>Enrol to track progress</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

async function hasEnrollment(courseId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .in("status", ["active", "completed"])
    .maybeSingle();
  return data !== null;
}
