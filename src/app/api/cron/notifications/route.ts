import type { NextRequest } from "next/server";

import { serverEnv } from "@/lib/env";
import { sendSms } from "@/lib/notifications/textlk";
import { sendEmail } from "@/lib/notifications/resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Notification outbox worker.
 *
 * Triggered by a scheduled GitHub Actions job hitting this route with the
 * shared `CRON_SECRET` — Vercel Hobby caps built-in crons at once a day,
 * which is too slow for OTP-adjacent and session-reminder SMS, so this is
 * driven externally instead (see the build plan's "Reliability" section).
 *
 * `claim_notifications()` uses `FOR UPDATE SKIP LOCKED`, so overlapping runs
 * (a slow run plus a fresh scheduled tick) never double-send the same
 * message — the second run simply claims a different batch.
 */
export async function POST(request: NextRequest) {
  const { CRON_SECRET } = serverEnv();

  if (!CRON_SECRET) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 501 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { error: reminderError } = await admin.rpc("enqueue_session_reminders");
  if (reminderError) {
    console.error("enqueue_session_reminders failed", reminderError);
  }

  const { data: batch, error: claimError } = await admin.rpc("claim_notifications", {
    p_limit: 25,
  });

  if (claimError) {
    console.error("claim_notifications failed", claimError);
    return Response.json({ error: "Failed to claim notifications" }, { status: 500 });
  }

  const results = { sent: 0, failed: 0, total: batch?.length ?? 0 };

  for (const notification of batch ?? []) {
    const payload = (notification.payload ?? {}) as Record<string, unknown>;

    const result =
      notification.channel === "sms"
        ? await sendSms(notification.recipient, String(payload.message ?? ""))
        : await sendEmail(
            notification.recipient,
            String(payload.subject ?? "CloudIskole"),
            String(payload.html ?? ""),
          );

    if (result.ok) {
      results.sent += 1;
      await admin
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", notification.id);
    } else {
      results.failed += 1;
      await admin
        .from("notifications")
        .update({ status: "failed", last_error: result.error })
        .eq("id", notification.id);
    }
  }

  return Response.json(results);
}
