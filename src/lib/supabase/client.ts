import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Supabase client for browser/Client Component code.
 *
 * Uses the anon key, which is public by design — every query it makes is
 * still subject to row-level security. This client must never be given the
 * service-role key; `npm run guard:secrets` fails the build if it is.
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
