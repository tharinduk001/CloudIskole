import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAllOrders } from "@/lib/data/admin";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  under_review: "warning",
  pending: "neutral",
  rejected: "danger",
  failed: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();
  const needsReview = orders.filter((o) => o.status === "under_review" || o.status === "pending");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Orders</h1>
      <p className="text-ink-muted mt-1 text-sm">
        {needsReview.length} awaiting review, {orders.length} shown total.
      </p>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opened</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-teal-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono font-semibold text-teal-700 hover:underline"
                  >
                    {order.reference_code}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{order.student.full_name}</div>
                  <div className="text-ink-subtle text-xs">{order.student.email}</div>
                </td>
                <td className="px-4 py-3 text-ink">{order.course.title}</td>
                <td className="px-4 py-3 text-ink">{formatLkr(order.amount_cents)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[order.status] ?? "neutral"} size="sm">
                    {order.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="text-ink-subtle px-4 py-3 text-xs">
                  {new Date(order.created_at).toLocaleDateString("en-LK")}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-ink-muted px-4 py-8 text-center">
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
