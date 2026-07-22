import { attachmentHeaders, todayStamp, toCsv } from "@/lib/admin/export";
import { requireAdmin } from "@/lib/data/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Every payment event row, the full append-only financial log. */
export async function GET() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: `Failed to export payment log: ${error.message}` },
      { status: 500 },
    );
  }

  return new Response(toCsv(data ?? []), {
    headers: attachmentHeaders(
      `payment-log-${todayStamp()}.csv`,
      "text/csv; charset=utf-8",
    ),
  });
}
