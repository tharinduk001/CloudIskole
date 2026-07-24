import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Gamification data access — CloudCoins, streaks, badges, leaderboard.
 *
 * "CloudCoins" is the on-site name for what the schema still tracks as XP
 * (table `xp_events`, function `award_xp()`) — the underlying ledger wasn't
 * renamed, only the name and icon students actually see.
 *
 * Everything here runs as the signed-in user (or anon) through plain RLS;
 * the only privileged writes are `award_xp()` and `record_activity()`, and
 * those happen exclusively inside the SECURITY DEFINER functions that
 * already move state on money/progress (see 20260719001600_gamification_wiring.sql)
 * — nothing here mutates anything.
 *
 * Digital credentials (Open Badge 3.0) are issued externally via
 * credentials.certdirectory.io, not tracked in this database.
 */

export type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  coins: number;
  rank: number;
};

function toLeaderboardEntry(
  row: Database["public"]["Views"]["leaderboard_all_time"]["Row"],
): LeaderboardEntry {
  return {
    user_id: row.user_id!,
    // `full_name` is `not null default ''`, so a student who never set one
    // has an empty string, not null — `??` alone would not catch that.
    full_name: row.full_name || "Anonymous",
    avatar_url: row.avatar_url,
    coins: row.xp ?? 0,
    rank: row.rank ?? 0,
  };
}

export async function listLeaderboard(
  period: "all_time" | "monthly",
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const table = period === "all_time" ? "leaderboard_all_time" : "leaderboard_monthly";
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to load leaderboard: ${error.message}`);
  return (data ?? []).map(toLeaderboardEntry);
}

export type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];
export type UserBadge = { badge: BadgeRow; awarded_at: string };

export type MyGamification = {
  totalCoins: number;
  streak: number;
  badges: UserBadge[];
  leaderboardOptIn: boolean;
};

/** CloudCoins total, current streak and badges for one user — used on the dashboard/profile. */
export async function getMyGamification(userId: string): Promise<MyGamification> {
  const supabase = await createClient();

  const [{ data: coinRows }, { data: streak }, { data: badgeRows }, { data: profile }] =
    await Promise.all([
      supabase.from("xp_events").select("points").eq("user_id", userId),
      supabase.rpc("current_streak", { p_user_id: userId }),
      supabase
        .from("user_badges")
        .select("awarded_at, badge:badges(*)")
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select("leaderboard_opt_in")
        .eq("id", userId)
        .maybeSingle(),
    ]);

  const totalCoins = (coinRows ?? []).reduce((sum, r) => sum + r.points, 0);

  return {
    totalCoins,
    streak: streak ?? 0,
    badges: (
      (badgeRows ?? []) as unknown as { awarded_at: string; badge: BadgeRow }[]
    ).map((r) => ({
      badge: r.badge,
      awarded_at: r.awarded_at,
    })),
    leaderboardOptIn: profile?.leaderboard_opt_in ?? false,
  };
}
