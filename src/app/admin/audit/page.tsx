import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAuditLogs, listPaymentEvents } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Audit & payments" };

export default async function AdminAuditPage() {
  const [auditLogs, paymentEvents] = await Promise.all([listAuditLogs(), listPaymentEvents()]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Payment events</h1>
        <p className="text-ink-muted mt-1 text-sm">
          The append-only financial log — every order transition, success or failure.
        </p>
        <Card className="mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Transition</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {paymentEvents.map((event) => (
                <tr key={event.id}>
                  <td className="text-ink-subtle px-4 py-2.5 text-xs">
                    {new Date(event.created_at).toLocaleString("en-LK")}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-teal-700">
                    {event.order?.reference_code ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge size="sm" variant="neutral">
                      {event.type}
                    </Badge>
                  </td>
                  <td className="text-ink-muted px-4 py-2.5 text-xs">
                    {event.from_status ?? "—"} &rarr; {event.to_status ?? "—"}
                  </td>
                  <td className="text-ink-muted px-4 py-2.5 text-xs">{event.note ?? "—"}</td>
                </tr>
              ))}
              {paymentEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-ink-muted px-4 py-8 text-center">
                    No payment events yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold">Audit log</h2>
        <p className="text-ink-muted mt-1 text-sm">
          Non-payment administrative actions — role changes, publishing, enrollment grants.
        </p>
        <Card className="mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-ink-subtle px-4 py-2.5 text-xs">
                    {new Date(log.created_at).toLocaleString("en-LK")}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge size="sm" variant="neutral">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="text-ink-muted px-4 py-2.5 text-xs">
                    {log.entity_type}
                    {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="text-ink-subtle px-4 py-2.5 font-mono text-xs">
                    {log.after ? JSON.stringify(log.after) : "—"}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-ink-muted px-4 py-8 text-center">
                    No audit entries yet.
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
