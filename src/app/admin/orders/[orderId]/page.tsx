import type { Metadata } from "next";

import { OrderActions } from "@/components/admin/order-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminSlipUrl } from "@/lib/admin/orders-actions";
import { getOrderForAdmin } from "@/lib/data/admin";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderForAdmin(orderId);
  const slipUrl = order.bank_transfer
    ? await getAdminSlipUrl(order.bank_transfer.slip_path)
    : null;

  const decidable = order.status === "under_review" || order.status === "pending";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold">{order.reference_code}</h1>
        <Badge variant={order.status === "paid" ? "success" : "neutral"}>
          {order.status.replace("_", " ")}
        </Badge>
      </div>

      <Card className="mt-6 p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
          <dt className="text-ink-muted">Student</dt>
          <dd className="text-ink font-medium">
            {order.student.full_name} &middot; {order.student.email}
          </dd>
          <dt className="text-ink-muted">Course</dt>
          <dd className="text-ink font-medium">{order.course.title}</dd>
          <dt className="text-ink-muted">Amount</dt>
          <dd className="text-ink font-semibold">{formatLkr(order.amount_cents)}</dd>
          <dt className="text-ink-muted">Opened</dt>
          <dd className="text-ink">
            {new Date(order.created_at).toLocaleString("en-LK")}
          </dd>
          {order.bank_transfer ? (
            <>
              <dt className="text-ink-muted">Depositor</dt>
              <dd className="text-ink">{order.bank_transfer.depositor_name ?? "—"}</dd>
              <dt className="text-ink-muted">Declared amount</dt>
              <dd className="text-ink">
                {order.bank_transfer.amount_declared_cents
                  ? formatLkr(order.bank_transfer.amount_declared_cents)
                  : "—"}
              </dd>
              <dt className="text-ink-muted">Slip</dt>
              <dd>
                {slipUrl ? (
                  <a
                    href={slipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-teal-600 hover:underline"
                  >
                    View submitted receipt
                  </a>
                ) : (
                  <span className="text-ink-subtle">Not available</span>
                )}
              </dd>
            </>
          ) : null}
        </dl>
      </Card>

      {decidable ? (
        <Card className="mt-4 p-6">
          <OrderActions orderId={order.id} />
        </Card>
      ) : order.status === "rejected" ? (
        <p className="text-ink-muted mt-4 text-sm">
          Rejected
          {order.bank_transfer?.reject_reason
            ? `: ${order.bank_transfer.reject_reason}`
            : "."}
        </p>
      ) : null}
    </div>
  );
}
