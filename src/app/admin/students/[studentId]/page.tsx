import { Award, Flame, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getStudentDetail } from "@/lib/data/admin";
import { getMyGamification } from "@/lib/data/gamification";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Student detail" };

const enrollmentStatusVariant: Record<string, "success" | "teal" | "danger"> = {
  active: "teal",
  completed: "success",
  revoked: "danger",
};

const orderStatusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  under_review: "warning",
  pending: "neutral",
  rejected: "danger",
  failed: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const [{ profile, enrollments, orders }, gamification] = await Promise.all([
    getStudentDetail(studentId),
    getMyGamification(studentId),
  ]);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/students"
        className="text-ink-muted mb-4 inline-block text-sm hover:text-teal-700"
      >
        ← Back to students
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {profile.full_name || "Unnamed student"}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">{profile.email}</p>
        </div>
        <div className="flex gap-3">
          <span className="border-line bg-surface inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm">
            <Zap className="text-gold-400 size-4" aria-hidden="true" />
            {gamification.totalXp} XP
          </span>
          <span className="border-line bg-surface inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm">
            <Flame className="text-danger size-4" aria-hidden="true" />
            {gamification.streak} day streak
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        {profile.phone ? <span className="text-ink-muted">{profile.phone}</span> : null}
        <span className="text-ink-muted">
          Joined {new Date(profile.created_at).toLocaleDateString("en-LK")}
        </span>
      </div>

      {gamification.badges.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {gamification.badges.map((b) => (
            <Badge key={b.badge.id} variant="gold" size="sm">
              <Award className="size-3" aria-hidden="true" />
              {b.badge.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <h2 className="font-display mt-8 text-lg font-semibold">Enrollments</h2>
      <Card className="mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Enrolled</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td className="text-ink px-4 py-3">{e.course.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={enrollmentStatusVariant[e.status] ?? "neutral"} size="sm">
                    {e.status}
                  </Badge>
                </td>
                <td className="text-ink px-4 py-3">{e.progress_pct}%</td>
                <td className="text-ink-subtle px-4 py-3 text-xs">
                  {new Date(e.enrolled_at).toLocaleDateString("en-LK")}
                </td>
              </tr>
            ))}
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-ink-muted px-4 py-6 text-center">
                  No enrollments yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <h2 className="font-display mt-8 text-lg font-semibold">Payment history</h2>
      <Card className="mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opened</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="text-ink px-4 py-3">{o.course.title}</td>
                <td className="text-ink px-4 py-3">{formatLkr(o.amount_cents)}</td>
                <td className="px-4 py-3">
                  <Badge variant={orderStatusVariant[o.status] ?? "neutral"} size="sm">
                    {o.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="text-ink-subtle px-4 py-3 text-xs">
                  {new Date(o.created_at).toLocaleDateString("en-LK")}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-ink-muted px-4 py-6 text-center">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
