import { z } from "zod";

/**
 * Validated environment access.
 *
 * Env vars are the single most common source of "works locally, 500s in
 * production" failures. Parsing them through Zod at module load turns a
 * silent `undefined` deep inside a request into a loud, named error at boot.
 *
 * The client/server split is a security boundary, not a convenience:
 * `clientEnv` may be imported from anywhere; `serverEnv()` throws if it is
 * ever reached from browser code.
 */

/* -------------------------------------------------------------------------- */
/* Client                                                                     */
/* -------------------------------------------------------------------------- */

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Phase 7. Optional so the app runs before a Sentry project exists.
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
});

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` only when referenced as a
 * static literal, so these cannot be read dynamically in a loop.
 */
const clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
});

if (!clientParsed.success) {
  throw new Error(
    `Invalid public environment variables:\n${formatIssues(clientParsed.error)}\n` +
      `Copy .env.example to .env.local and fill these in.`,
  );
}

export const clientEnv = clientParsed.data;

/* -------------------------------------------------------------------------- */
/* Server                                                                     */
/* -------------------------------------------------------------------------- */

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Phase 3+. Optional so the app boots before these services are configured;
  // the modules that consume them assert their presence at point of use.
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  TEXTLK_API_TOKEN: z.string().min(1).optional(),
  TEXTLK_SENDER_ID: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(32).optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let serverCache: ServerEnv | null = null;

/**
 * Server-only environment. Lazily parsed and cached.
 *
 * @throws if called from the browser, or if a required var is missing.
 */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "serverEnv() was called in the browser. This would leak secrets — " +
        "import it only from server components, server actions, or route handlers.",
    );
  }

  if (serverCache) return serverCache;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatIssues(parsed.error)}`,
    );
  }

  serverCache = parsed.data;
  return serverCache;
}

/** Renders Zod issues as an indented, one-per-line list. */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}
