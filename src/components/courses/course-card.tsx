import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDuration, formatLevel, formatLkr } from "@/lib/format";
import type { CourseSummary } from "@/lib/data/courses";

export function CourseCard({ course }: { course: CourseSummary }) {
  const duration = course.duration_minutes
    ? formatDuration(course.duration_minutes * 60)
    : null;

  return (
    <Link href={`/courses/${course.slug}`} className="group block rounded-2xl">
      <Card interactive className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={course.is_free ? "success" : "teal"}>
            {course.is_free ? "Free" : formatLkr(course.price_cents)}
          </Badge>
          <Badge variant="neutral" size="sm">
            {formatLevel(course.level)}
          </Badge>
        </div>

        <h3 className="font-display mt-4 text-lg font-semibold group-hover:text-teal-700">
          {course.title}
        </h3>
        {course.subtitle ? (
          <p className="text-ink-muted mt-2 line-clamp-2 text-sm leading-relaxed">
            {course.subtitle}
          </p>
        ) : null}

        <div className="border-line text-ink-subtle mt-auto flex items-center justify-between gap-4 border-t pt-5 text-xs">
          <span className="flex items-center gap-1.5">
            {duration ? (
              <>
                <Clock className="size-3.5" aria-hidden="true" />
                {duration}
              </>
            ) : (
              course.category
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-teal-600 group-hover:gap-1.5">
            View course
            <ArrowRight className="size-3.5 transition-[gap]" aria-hidden="true" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
