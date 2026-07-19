import "server-only";

import { serverEnv } from "@/lib/env";

export type SendResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true }
  | { ok: false; skipped: false; error: string };

/**
 * Sends an SMS via text.lk's REST API.
 *
 * Returns `{ skipped: true }` rather than throwing when the credentials
 * aren't configured, so the app runs (and OTP codes fall back to a
 * dev-visible message) before a text.lk account exists — see the "open
 * items" note in the build plan. Once `TEXTLK_API_TOKEN` is set, real SMS
 * goes out with no code change here.
 */
export async function sendSms(to: string, message: string): Promise<SendResult> {
  const { TEXTLK_API_TOKEN, TEXTLK_SENDER_ID } = serverEnv();

  if (!TEXTLK_API_TOKEN || !TEXTLK_SENDER_ID) {
    console.warn(`[sms:skipped] to=${to} message=${message}`);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEXTLK_API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient: to.replace(/^\+/, ""),
        sender_id: TEXTLK_SENDER_ID,
        type: "plain",
        message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, skipped: false, error: `text.lk ${res.status}: ${body}` };
    }

    return { ok: true, skipped: false };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
