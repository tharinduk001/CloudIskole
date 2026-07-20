import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaThumb } from "@/components/ui/media-thumb";
import { formatDuration, formatLevel, formatLkr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/lib/data/courses";

export function CourseCard({ course }: { course: CourseSummary }) {
  const duration = course.duration_minutes
    ? formatDuration(course.duration_minutes * 60)
    : null;

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <Card
        interactive
        className="border-hairline hover:border-onyx flex h-full flex-col overflow-hidden rounded-none p-0 hover:-translate-y-0.5 hover:shadow-md"
      >
        <MediaThumb src={course.thumbnail_path} alt="" />

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <Badge
              className={cn(
                "rounded-none border-0",
                course.is_free ? "bg-mint-500/15 text-mint-500" : "bg-onyx/10 text-onyx",
              )}
            >
              {course.is_free ? "Free" : formatLkr(course.price_cents)}
            </Badge>
            <Badge
              className="bg-hairline/60 text-onyx-soft rounded-none border-0"
              size="sm"
            >
              {formatLevel(course.level)}
            </Badge>
          </div>

          <h3 className="font-display text-onyx group-hover:text-terracotta-600 mt-4 text-lg font-semibold">
            {course.title}
          </h3>
          {course.subtitle ? (
            <p className="text-mist mt-2 line-clamp-2 text-sm leading-relaxed">
              {course.subtitle}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-4 pt-5">
            <span className="text-mist flex items-center gap-1.5 text-xs">
              {duration ? (
                <>
                  <Clock className="size-3.5" aria-hidden="true" />
                  {duration}
                </>
              ) : (
                course.category
              )}
            </span>
            <span className="border-onyx text-onyx group-hover:bg-onyx inline-flex items-center gap-1.5 border px-3.5 py-2 text-xs font-medium group-hover:text-white">
              View course
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
