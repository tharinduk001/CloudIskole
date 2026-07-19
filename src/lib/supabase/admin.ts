import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Service-role Supabase client. **Bypasses every row-level security policy.**
 *
 * The `server-only` import above is a hard build-time barrier: if any module
 * reachable from a Client Component imports this file, the build fails rather
 * than shipping the key to a browser.
 *
 * Legitimate uses are narrow:
 *   - approving a payment and calling `grant_enrollment()`
 *   - the notification worker claiming and sending queued messages
 *   - cron jobs run with `CRON_SECRET`
 *   - payment gateway webhooks, after signature verification
 *
 * Do NOT reach for this to "fix" an RLS policy that is blocking a read. If a
 * student cannot see their own row, the policy is wrong; widening privilege
 * here hides the bug and removes the protection for every other user too.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();

  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // This client is not a user session: never persist or refresh tokens.
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
