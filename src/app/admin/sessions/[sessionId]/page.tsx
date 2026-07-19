import type { Metadata } from "next";

import { AttendanceToggle } from "@/components/admin/attendance-toggle";
import { SessionForm } from "@/components/admin/session-form";
import { SessionStatusControls } from "@/components/admin/session-status-controls";
import { Card } from "@/components/ui/card";
import { getSessionForAdmin, listCoursesAdmin, listRegistrationsForSession } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit session" };

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const [session, courses, registrations] = await Promise.all([
    getSessionForAdmin(sessionId),
    listCoursesAdmin(),
    listRegistrationsForSession(sessionId),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">{session.title}</h1>
        <SessionStatusControls sessionId={session.id} status={session.status} />
      </div>

      <Card className="mt-6 p-6">
        <SessionForm session={session} courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      </Card>

      <h2 className="font-display mt-10 text-lg font-semibold">
        Registrations ({registrations.length}
        {session.capacity ? ` / ${session.capacity}` : ""})
      </h2>
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {registrations.map((reg) => (
              <tr key={reg.id}>
                <td className="px-4 py-3">
                  <div className="text-ink font-medium">{reg.student.full_name}</div>
                  <div className="text-ink-subtle text-xs">{reg.student.email}</div>
                </td>
                <td className="text-ink-muted px-4 py-3">{dateFormatter.format(new Date(reg.registered_at))}</td>
                <td className="px-4 py-3">
                  <AttendanceToggle sessionId={session.id} userId={reg.user_id} attended={reg.attended} />
                </td>
              </tr>
            ))}
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-ink-muted px-4 py-8 text-center">
                  No one has registered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
