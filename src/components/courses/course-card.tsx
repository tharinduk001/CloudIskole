import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
        className="border-hairline hover:border-onyx flex h-full flex-col rounded-none p-6 hover:-translate-y-0.5 hover:shadow-md"
      >
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

        <div className="border-hairline text-mist mt-auto flex items-center justify-between gap-4 border-t pt-5 text-xs">
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
          <span className="text-terracotta-600 inline-flex items-center gap-1 font-medium group-hover:gap-1.5">
            View course
            <ArrowRight className="size-3.5 transition-[gap]" aria-hidden="true" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
