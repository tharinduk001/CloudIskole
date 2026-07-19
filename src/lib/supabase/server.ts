import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Acts as the signed-in user, so RLS applies exactly as it would in the
 * browser. This is deliberate: server code gets no ambient privilege, and a
 * bug in a page cannot read another student's rows.
 *
 * Must be created per request — never hoisted to a module-level singleton,
 * which would leak one user's session into another user's request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. This is expected and safe:
            // `proxy.ts` refreshes the session on every request, so the
            // refreshed cookie still reaches the browser.
          }
        },
      },
    },
  );
}

/**
 * The signed-in user, verified against the auth server.
 *
 * Always prefer this over `getSession()` in server code. `getSession()` reads
 * the cookie and trusts its contents; `getUser()` validates the JWT with
 * Supabase. On a route that authorises anything, that difference matters.
 *
 * @returns the user, or null when signed out.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
