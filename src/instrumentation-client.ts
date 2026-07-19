import * as Sentry from "@sentry/nextjs";

import { clientEnv } from "@/lib/env";

/**
 * Browser-side Sentry init (Next.js `instrumentation-client` convention).
 * No-ops without `NEXT_PUBLIC_SENTRY_DSN` — see src/instrumentation.ts.
 */
if (clientEnv.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    // Session replay is off by default: it would capture a student's quiz
    // answers and payment slip uploads on screen. Turn on deliberately,
    // with masking configured, if that trade-off is ever wanted.
    debug: false,
  });
}
