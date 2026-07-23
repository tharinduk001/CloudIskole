import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Range-filterable dashboard analytics.
 *
 * Reads as the signed-in admin via plain RLS/grants, same idiom as the rest
 * of `src/lib/data/admin.ts` — nothing here is a privileged mutation, so
 * there's no reason to bypass RLS with the service-role client.
 */

export type DashboardRange = "7d" | "30d" | "90d" | "all";

const RANGE_DAYS: Record<Exclude<DashboardRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** `null` means "all time" — no lower bound. */
function rangeToSince(range: DashboardRange): Date | null {
  if (range === "all") return null;
  const days = RANGE_DAYS[range];
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export type RevenueSummary = {
  currentCents: number;
  /** `null` when the range is "all time" — a prior period is meaningless. */
  previousCents: number | null;
  changePct: number | null;
};

/** Revenue for the selected range, plus the change vs. an equal-length prior period. */
export async function getRevenueSummary(range: DashboardRange): Promise<RevenueSummary> {
  const supabase = await createClient();
  const since = rangeToSince(range);

  let currentQuery = supabase.from("orders").select("amount_cents").eq("status", "paid");
  if (since) currentQuery = currentQuery.gte("paid_at", since.toISOString());
  const { data: currentOrders, error: currentError } = await currentQuery;
  if (currentError) throw new Error(`Failed to load revenue: ${currentError.message}`);
  const currentCents = (currentOrders ?? []).reduce((sum, o) => sum + o.amount_cents, 0);

  if (!since) {
    return { currentCents, previousCents: null, changePct: null };
  }

  const rangeMs = Date.now() - since.getTime();
  const previousSince = new Date(since.getTime() - rangeMs);

  const { data: previousOrders, error: previousError } = await supabase
    .from("orders")
    .select("amount_cents")
    .eq("status", "paid")
    .gte("paid_at", previousSince.toISOString())
    .lt("paid_at", since.toISOString());
  if (previousError)
    throw new Error(`Failed to load previous-period revenue: ${previousError.message}`);
  const previousCents = (previousOrders ?? []).reduce((sum, o) => sum + o.amount_cents, 0);

  const changePct =
    previousCents > 0
      ? Math.round(((currentCents - previousCents) / previousCents) * 100)
      : currentCents > 0
        ? 100
        : 0;

  return { currentCents, previousCents, changePct };
}

export type TrendPoint = { date: string; value: number };

/** Daily revenue (from paid orders) for the selected range. */
export async function getRevenueOverTime(range: DashboardRange): Promise<TrendPoint[]> {
  const supabase = await createClient();
  const since = rangeToSince(range);
  const { data, error } = await supabase.rpc("revenue_over_time", {
    // The function accepts and expects a null timestamp for "all time" (see
    // 20260723000300_student_admin_summary.sql) — the generated arg type is
    // non-nullable only because Postgres has no way to mark a plpgsql param
    // nullable independent of its default.
    p_since: (since ? since.toISOString() : null) as unknown as string,
  });

  if (error) throw new Error(`Failed to load revenue trend: ${error.message}`);
  return (data ?? []).map((row) => ({ date: row.day, value: row.revenue_cents }));
}

/** Daily new enrollments for the selected range. */
export async function getEnrollmentsOverTime(range: DashboardRange): Promise<TrendPoint[]> {
  const supabase = await createClient();
  const since = rangeToSince(range);
  const { data, error } = await supabase.rpc("enrollments_over_time", {
    p_since: (since ? since.toISOString() : null) as unknown as string,
  });

  if (error) throw new Error(`Failed to load enrollment trend: ${error.message}`);
  return (data ?? []).map((row) => ({ date: row.day, value: row.enrollment_count }));
}

export type StatusBreakdownEntry = { status: string; count: number };

/** Order counts by status within the selected range, most common first. */
export async function getOrderStatusBreakdown(
  range: DashboardRange,
): Promise<StatusBreakdownEntry[]> {
  const supabase = await createClient();
  const since = rangeToSince(range);

  let query = supabase.from("orders").select("status");
  if (since) query = query.gte("created_at", since.toISOString());
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load order status breakdown: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);

  return Array.from(counts, ([status, count]) => ({ status, count })).sort(
    (a, b) => b.count - a.count,
  );
}

export type CourseRevenueEntry = {
  courseId: string;
  title: string;
  revenueCents: number;
  orderCount: number;
};

/** Top courses by revenue within the selected range. */
export async function getRevenueByCourse(
  range: DashboardRange,
  limit = 10,
): Promise<CourseRevenueEntry[]> {
  const supabase = await createClient();
  const since = rangeToSince(range);

  let query = supabase
    .from("orders")
    .select("course_id, amount_cents, course:courses(title)")
    .eq("status", "paid");
  if (since) query = query.gte("paid_at", since.toISOString());
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load revenue by course: ${error.message}`);

  const byCourse = new Map<string, { title: string; revenueCents: number; orderCount: number }>();
  for (const row of data ?? []) {
    const title = (row.course as unknown as { title: string } | null)?.title ?? "Unknown course";
    const existing = byCourse.get(row.course_id);
    if (existing) {
      existing.revenueCents += row.amount_cents;
      existing.orderCount += 1;
    } else {
      byCourse.set(row.course_id, { title, revenueCents: row.amount_cents, orderCount: 1 });
    }
  }

  return Array.from(byCourse, ([courseId, v]) => ({ courseId, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
}
