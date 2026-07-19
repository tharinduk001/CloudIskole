import type { Instrumentation } from "next";

import { clientEnv } from "@/lib/env";

/**
 * Server/edge startup hook (Next.js instrumentation convention).
 *
 * Sentry is entirely optional: without `NEXT_PUBLIC_SENTRY_DSN` set,
 * `register()` and `onRequestError` are no-ops and the app behaves exactly
 * as before Phase 7. The DSN itself is not a secret (it identifies a
 * project, not a credential) — the same value is used client- and
 * server-side, which is why it carries the NEXT_PUBLIC_ prefix.
 */
export async function register() {
  if (!clientEnv.NEXT_PUBLIC_SENTRY_DSN) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    // Server-side errors carry request bodies (payment slips, quiz answers);
    // keep this low unless actively debugging.
    debug: false,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!clientEnv.NEXT_PUBLIC_SENTRY_DSN) return;

  const Sentry = await import("@sentry/nextjs");
  await Sentry.captureRequestError(...args);
};
