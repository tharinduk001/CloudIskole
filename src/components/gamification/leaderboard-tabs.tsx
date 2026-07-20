"use client";

import { Medal } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Card } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/lib/data/gamification";
import { cn } from "@/lib/utils";

const medalColor: Record<number, string> = {
  1: "text-terracotta-500",
  2: "text-mist-soft",
  3: "text-[#B4813E]",
};

function LeaderboardTable({
  entries,
  meId,
}: {
  entries: LeaderboardEntry[];
  meId?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-mist p-8 text-center text-sm">
        No one is ranked yet - be the first to opt in from your profile.
      </p>
    );
  }

  return (
    <ol className="divide-hairline divide-y">
      {entries.map((entry) => (
        <li
          key={entry.user_id}
          className={cn(
            "flex items-center gap-4 px-4 py-3",
            entry.user_id === meId && "bg-terracotta-50/60",
          )}
        >
          <span
            className={cn(
              "w-7 shrink-0 text-center text-sm font-semibold",
              medalColor[entry.rank] ?? "text-mist-soft",
            )}
          >
            {entry.rank <= 3 ? (
              <Medal className="mx-auto size-4" aria-hidden="true" />
            ) : (
              entry.rank
            )}
          </span>
          {entry.avatar_url ? (
            <Image
              src={entry.avatar_url}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8 shrink-0 rounded-none object-cover"
            />
          ) : (
            <span className="bg-onyx grid size-8 shrink-0 place-items-center rounded-none text-xs font-semibold text-white">
              {entry.full_name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-onyx truncate text-sm font-medium">
              {entry.full_name}
              {entry.user_id === meId ? (
                <span className="text-terracotta-600"> (you)</span>
              ) : null}
            </p>
            {entry.district ? (
              <p className="text-mist-soft text-xs">{entry.district}</p>
            ) : null}
          </div>
          <span className="text-onyx font-display text-sm font-semibold">
            {entry.xp} XP
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LeaderboardTabs({
  allTime,
  monthly,
  meId,
}: {
  allTime: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  meId?: string;
}) {
  const [tab, setTab] = React.useState<"all_time" | "monthly">("all_time");

  return (
    <div>
      <div className="border-hairline inline-flex gap-1 border p-1">
        <button
          type="button"
          onClick={() => setTab("all_time")}
          className={cn(
            "px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "all_time" ? "bg-onyx text-white" : "text-mist hover:text-onyx",
          )}
        >
          All time
        </button>
        <button
          type="button"
          onClick={() => setTab("monthly")}
          className={cn(
            "px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "monthly" ? "bg-onyx text-white" : "text-mist hover:text-onyx",
          )}
        >
          This month
        </button>
      </div>

      <Card className="border-hairline mt-5 overflow-hidden rounded-none">
        <LeaderboardTable entries={tab === "all_time" ? allTime : monthly} meId={meId} />
      </Card>
    </div>
  );
}
