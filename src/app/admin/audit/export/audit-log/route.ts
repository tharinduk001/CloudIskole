import { attachmentHeaders, todayStamp, toCsv } from "@/lib/admin/export";
import { requireAdmin } from "@/lib/data/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Every audit log row, not just the last 100 shown on the admin page. */
export async function GET() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: `Failed to export audit log: ${error.message}` },
      { status: 500 },
    );
  }

  return new Response(toCsv(data ?? []), {
    headers: attachmentHeaders(
      `audit-log-${todayStamp()}.csv`,
      "text/csv; charset=utf-8",
    ),
  });
}
