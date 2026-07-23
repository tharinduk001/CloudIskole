import "server-only";

import { serverEnv } from "@/lib/env";

import type { SendResult } from "./textlk";

/**
 * Sends an email via Resend's REST API.
 *
 * Same fallback behaviour as `sendSms`: skips (rather than failing the
 * caller) when `RESEND_API_KEY` isn't configured, since that account is
 * another of the build plan's open items.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: { replyTo?: string },
): Promise<SendResult> {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = serverEnv();

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn(`[email:skipped] to=${to} subject=${subject}`);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject,
        html,
        ...(options?.replyTo ? { reply_to: options.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, skipped: false, error: `Resend ${res.status}: ${body}` };
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
