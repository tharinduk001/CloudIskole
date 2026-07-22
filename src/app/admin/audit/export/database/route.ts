import { attachmentHeaders, todayStamp } from "@/lib/admin/export";
import { requireAdmin } from "@/lib/data/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/**
 * Every table in the `public` schema, logically dumped as JSON — the
 * closest thing to a manual `pg_dump` available without shell/psql access
 * to the production database (Supabase's hosted Postgres isn't reachable
 * that way from a serverless deploy).
 *
 * `phone_otp_codes` is deliberately excluded: it holds short-lived OTP
 * secrets, not durable data worth backing up. `auth.users` (email, sign-in
 * state) lives in Supabase's own managed auth schema, which Supabase backs
 * up separately — this only covers `public`.
 */
const TABLES = [
  "profiles",
  "courses",
  "modules",
  "lessons",
  "enrollments",
  "lesson_progress",
  "quizzes",
  "quiz_questions",
  "quiz_options",
  "quiz_attempts",
  "quiz_attempt_answers",
  "sessions",
  "session_registrations",
  "orders",
  "bank_transfers",
  "payment_events",
  "audit_logs",
  "notifications",
  "badges",
  "user_badges",
  "xp_events",
  "user_activity_days",
  "partners",
  "highlights",
  "founder_profile",
  "founder_education",
  "founder_experience",
  "founder_certifications",
  "contact_messages",
] as const satisfies readonly (keyof Database["public"]["Tables"])[];

export async function GET() {
  await requireAdmin();

  const admin = createAdminClient();

  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await admin.from(table).select("*");
      if (error) throw new Error(`Failed to export ${table}: ${error.message}`);
      return [table, data ?? []] as const;
    }),
  );

  const backup = {
    exportedAt: new Date().toISOString(),
    tables: Object.fromEntries(results),
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: attachmentHeaders(
      `cloudiskole-backup-${todayStamp()}.json`,
      "application/json; charset=utf-8",
    ),
  });
}
