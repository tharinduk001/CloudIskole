import { Calendar, Radio, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaThumb } from "@/components/ui/media-thumb";
import type { SessionSummary } from "@/lib/data/sessions";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function SessionCard({ session }: { session: SessionSummary }) {
  const seatsLeft =
    session.capacity != null
      ? Math.max(session.capacity - (session.registered_count ?? 0), 0)
      : null;

  return (
    <Link href={`/sessions/${session.slug}`} className="group block">
      <Card
        interactive
        className="border-hairline hover:border-onyx flex h-full flex-col overflow-hidden rounded-none p-0 hover:-translate-y-0.5 hover:shadow-md"
      >
        <MediaThumb src={session.cover_image_path} alt="" />

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-2">
            {session.status === "live" ? (
              <Badge
                className="bg-terracotta-600 rounded-none border-0 text-white"
                size="sm"
              >
                <Radio aria-hidden="true" />
                Live now
              </Badge>
            ) : null}
            <Badge
              className={cn(
                "rounded-none border-0",
                session.is_free ? "bg-mint-500/15 text-mint-500" : "bg-onyx/10 text-onyx",
              )}
              size="sm"
            >
              {session.is_free ? "Free" : "Paid"}
            </Badge>
          </div>

          <h2 className="font-display text-onyx group-hover:text-terracotta-600 mt-3 text-lg font-semibold">
            {session.title}
          </h2>
          {session.description ? (
            <p className="text-mist mt-2 line-clamp-2 text-sm leading-relaxed">
              {session.description}
            </p>
          ) : null}

          <div className="text-mist-soft mt-auto flex flex-wrap items-center gap-4 pt-5 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              {dateFormatter.format(new Date(session.starts_at))}
            </span>
            {seatsLeft !== null && session.status === "upcoming" ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
              </span>
            ) : null}
          </div>

          <span className="border-onyx text-onyx group-hover:bg-onyx mt-4 inline-flex w-fit items-center gap-1.5 border px-3.5 py-2 text-xs font-medium group-hover:text-white">
            {session.status === "completed" ? "View recording" : "View details"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
