import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAllOrders } from "@/lib/data/admin";
import { formatLkr } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Orders" };

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  under_review: "warning",
  pending: "neutral",
  rejected: "danger",
  failed: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

const STATUSES: OrderStatus[] = [
  "under_review",
  "pending",
  "paid",
  "rejected",
  "failed",
  "cancelled",
  "refunded",
];

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return value !== undefined && (STATUSES as string[]).includes(value);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const status = isOrderStatus(params.status) ? params.status : undefined;
  const from = params.from || undefined;
  const to = params.to || undefined;

  const orders = await listAllOrders({ status, from, to });
  const needsReview = orders.filter(
    (o) => o.status === "under_review" || o.status === "pending",
  );
  const filteredRevenueCents = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  const hasFilters = Boolean(status || from || to);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Orders</h1>
      <p className="text-ink-muted mt-1 text-sm">
        {needsReview.length} awaiting review, {orders.length} shown total.
      </p>

      <form
        method="get"
        className="border-line bg-surface mt-6 flex flex-wrap items-end gap-3 rounded-xl border p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-ink-muted text-xs font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="border-line-strong bg-surface text-ink h-10 rounded-lg border px-3 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-ink-muted text-xs font-medium">
            From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={from?.slice(0, 10)}
            className="border-line-strong bg-surface text-ink h-10 rounded-lg border px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-ink-muted text-xs font-medium">
            To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={to?.slice(0, 10)}
            className="border-line-strong bg-surface text-ink h-10 rounded-lg border px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 h-10 rounded-lg px-5 text-sm font-medium text-white"
        >
          Filter
        </button>
        {hasFilters ? (
          <Link href="/admin/orders" className="text-ink-subtle text-sm hover:underline">
            Clear filters
          </Link>
        ) : null}
      </form>

      <p className="text-ink-muted mt-4 text-sm">
        <span className="text-ink font-semibold">{formatLkr(filteredRevenueCents)}</span> total
        paid from {orders.length} {hasFilters ? "matching" : ""} order
        {orders.length === 1 ? "" : "s"}.
      </p>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
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
                <td className="text-ink px-4 py-3">{order.course.title}</td>
                <td className="text-ink px-4 py-3">{formatLkr(order.amount_cents)}</td>
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
                  No orders match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
