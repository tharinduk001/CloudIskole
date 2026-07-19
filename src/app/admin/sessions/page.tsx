import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listSessionsAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Sessions" };

const statusVariant = {
  upcoming: "info",
  live: "danger",
  completed: "success",
  cancelled: "neutral",
} as const;

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminSessionsPage() {
  const sessions = await listSessionsAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Sessions</h1>
        <Button asChild size="sm">
          <Link href="/admin/sessions/new">
            <Plus aria-hidden="true" />
            New session
          </Link>
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-teal-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/sessions/${session.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {session.title}
                  </Link>
                  <div className="text-ink-subtle text-xs">/{session.slug}</div>
                </td>
                <td className="text-ink-muted px-4 py-3">
                  {dateFormatter.format(new Date(session.starts_at))}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[session.status]} size="sm">
                    {session.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-ink-muted px-4 py-8 text-center">
                  No sessions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
