import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Gamification data access — XP, streaks, badges, certificates, leaderboard.
 *
 * Everything here runs as the signed-in user (or anon) through plain RLS;
 * the only privileged writes are `award_xp()`, `record_activity()` and
 * certificate issuance, and those happen exclusively inside the SECURITY
 * DEFINER functions that already move state on money/progress (see
 * 20260719001600_gamification_wiring.sql) — nothing here mutates anything.
 */

export type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  district: string | null;
  xp: number;
  rank: number;
};

function toLeaderboardEntry(
  row: Database["public"]["Views"]["leaderboard_all_time"]["Row"],
): LeaderboardEntry {
  return {
    user_id: row.user_id!,
    // Same empty-string-vs-null note as getCertificateHolderName below.
    full_name: row.full_name || "Anonymous",
    avatar_url: row.avatar_url,
    district: row.district,
    xp: row.xp ?? 0,
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
  totalXp: number;
  streak: number;
  badges: UserBadge[];
  leaderboardOptIn: boolean;
};

/** XP total, current streak and badges for one user — used on the dashboard/profile. */
export async function getMyGamification(userId: string): Promise<MyGamification> {
  const supabase = await createClient();

  const [{ data: xpRows }, { data: streak }, { data: badgeRows }, { data: profile }] =
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

  const totalXp = (xpRows ?? []).reduce((sum, r) => sum + r.points, 0);

  return {
    totalXp,
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

export type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"] & {
  course: { title: string; slug: string };
};

/** The signed-in student's own certificates, most recent first. */
export async function listMyCertificates(userId: string): Promise<CertificateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*, course:courses(title, slug)")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error) throw new Error(`Failed to load certificates: ${error.message}`);
  return data as unknown as CertificateRow[];
}

export type CertificateVerification =
  Database["public"]["Views"]["certificate_verification"]["Row"];

/** Public verification: proves a certificate is genuine, reveals nothing else. */
export async function getCertificateByCode(
  code: string,
): Promise<CertificateVerification | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificate_verification")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return data;
}

/** The full certificate for its owner (or an admin) to view/print. 404s otherwise via RLS returning no row. */
export async function getCertificateForViewer(code: string): Promise<CertificateRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*, course:courses(title, slug)")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) notFound();
  return data as unknown as CertificateRow;
}

/** The certificate holder's display name, for the printable certificate page. */
export async function getCertificateHolderName(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  // `??` alone doesn't catch this: `full_name` is `not null default ''`, so a
  // student who never set one has an empty string, not null.
  return data?.full_name || "CloudIskole student";
}
