import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Anon-key Supabase client with no cookie/session binding, for contexts that
 * must not touch request-scoped APIs — `sitemap.ts`, `robots.ts`, build-time
 * generation.
 *
 * `src/lib/supabase/server.ts`'s `createClient()` calls `cookies()`, which
 * forces Next.js to treat the entire route as dynamic (no static HTML, no
 * CDN caching) even for a page like the sitemap that only ever reads public,
 * anonymous-readable rows. This client reads the exact same publicly-visible
 * data — RLS still applies, scoped to the `anon` role — without that cost.
 *
 * Do not use this for anything that should reflect a signed-in user; it has
 * no session and never will.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
