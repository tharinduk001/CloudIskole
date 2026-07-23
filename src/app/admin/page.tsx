import {
  BookOpen,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AreaTrendChart } from "@/components/admin/area-trend-chart";
import { StatusBreakdownBars } from "@/components/admin/status-breakdown-bars";
import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/data/admin";
import {
  getEnrollmentsOverTime,
  getOrderStatusBreakdown,
  getRevenueByCourse,
  getRevenueOverTime,
  getRevenueSummary,
  type DashboardRange,
} from "@/lib/data/admin-analytics";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Admin overview" };

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function isRange(value: string | undefined): value is DashboardRange {
  return value === "7d" || value === "30d" || value === "90d" || value === "all";
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: DashboardRange = isRange(params.range) ? params.range : "30d";

  const [
    overview,
    revenueSummary,
    revenueOverTime,
    enrollmentsOverTime,
    statusBreakdown,
    revenueByCourse,
  ] = await Promise.all([
    getAdminOverview(),
    getRevenueSummary(range),
    getRevenueOverTime(range),
    getEnrollmentsOverTime(range),
    getOrderStatusBreakdown(range),
    getRevenueByCourse(range),
  ]);

  const cards = [
    {
      label: "Total revenue",
      value: formatLkr(overview.revenueAllTimeCents),
      href: "/admin/orders",
      icon: Wallet,
    },
    {
      label: "Orders awaiting review",
      value: overview.pendingReview,
      href: "/admin/orders",
      icon: ReceiptText,
      highlight: overview.pendingReview > 0,
    },
    {
      label: "Students",
      value: overview.totalStudents,
      href: "/admin/students",
      icon: Users,
    },
    {
      label: "Courses",
      value: overview.totalCourses,
      href: "/admin/courses",
      icon: BookOpen,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">Admin overview</h1>
        <div className="border-line bg-surface inline-flex rounded-full border p-1 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={r.value === "30d" ? "/admin" : `/admin?range=${r.value}`}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                range === r.value
                  ? "bg-teal-600 text-white"
                  : "text-ink-muted hover:bg-teal-50/60"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card
              interactive
              className={`p-5 ${c.highlight ? "border-gold-300 bg-gold-50/40" : ""}`}
            >
              <c.icon className="text-ink-subtle size-5" aria-hidden="true" />
              <p className="text-ink mt-3 text-3xl font-semibold">{c.value}</p>
              <p className="text-ink-muted mt-1 text-sm">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-ink-muted text-sm">Revenue in this range</p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-ink text-2xl font-semibold">
              {formatLkr(revenueSummary.currentCents)}
            </p>
            {revenueSummary.changePct !== null ? (
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  revenueSummary.changePct >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {revenueSummary.changePct >= 0 ? (
                  <TrendingUp className="size-4" aria-hidden="true" />
                ) : (
                  <TrendingDown className="size-4" aria-hidden="true" />
                )}
                {Math.abs(revenueSummary.changePct)}% vs previous period
              </span>
            ) : null}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-ink-muted text-sm">New enrollments this week</p>
          <div className="mt-2 flex items-center gap-2">
            <UserPlus className="text-ink-subtle size-5" aria-hidden="true" />
            <p className="text-ink text-2xl font-semibold">
              {overview.newEnrollmentsThisWeek}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-ink text-base font-semibold">Revenue</h2>
          <div className="mt-4">
            <AreaTrendChart
              data={revenueOverTime}
              valueType="currency"
              color="var(--color-teal-600)"
            />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-ink text-base font-semibold">Enrollments</h2>
          <div className="mt-4">
            <AreaTrendChart
              data={enrollmentsOverTime}
              valueType="count"
              color="var(--color-gold-400)"
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-ink text-base font-semibold">Order status mix</h2>
          <div className="mt-4">
            <StatusBreakdownBars entries={statusBreakdown} />
          </div>
        </Card>
        <Card className="overflow-hidden p-0">
          <h2 className="font-display text-ink px-5 pt-5 text-base font-semibold">
            Top courses by revenue
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
              <tr>
                <th className="px-5 py-2">Course</th>
                <th className="px-5 py-2">Orders</th>
                <th className="px-5 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {revenueByCourse.map((c) => (
                <tr key={c.courseId}>
                  <td className="text-ink px-5 py-2.5">{c.title}</td>
                  <td className="text-ink-muted px-5 py-2.5">{c.orderCount}</td>
                  <td className="text-ink px-5 py-2.5 font-medium">
                    {formatLkr(c.revenueCents)}
                  </td>
                </tr>
              ))}
              {revenueByCourse.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-ink-muted px-5 py-6 text-center">
                    No revenue in this range yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
