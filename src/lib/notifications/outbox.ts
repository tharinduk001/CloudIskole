import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type Channel = Database["public"]["Enums"]["notification_channel"];

export type EnqueueInput = {
  channel: Channel;
  recipient: string;
  userId?: string;
  template: string;
  payload?: Record<string, Json>;
  /** Set for messages that must never be sent twice. */
  dedupeKey?: string;
  scheduledFor?: Date;
};

/**
 * Writes a row to the notification outbox and returns immediately.
 *
 * `notifications` has no INSERT policy for `authenticated` or `anon` —
 * deliberately, since it carries phone numbers and message payloads — so
 * this goes through the service-role client. The actual delivery happens
 * later, out of the request path, when `/api/cron/notifications` claims the
 * row; see that route and `claim_notifications()` (0008 migration).
 */
export async function enqueueNotification(input: EnqueueInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("notifications").insert({
    channel: input.channel,
    recipient: input.recipient,
    user_id: input.userId ?? null,
    template: input.template,
    payload: input.payload ?? {},
    dedupe_key: input.dedupeKey ?? null,
    scheduled_for: (input.scheduledFor ?? new Date()).toISOString(),
  });

  // A dedupe collision is the desired outcome (message already queued/sent),
  // not a failure — everything else is logged so a broken integration is
  // visible without taking down the caller's actual action.
  if (error && error.code !== "23505") {
    console.error("enqueueNotification failed", input.template, error);
  }
}
