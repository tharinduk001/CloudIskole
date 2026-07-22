import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { signInWithEmailOtp } from "../../helpers/auth";

/**
 * Supabase's fixed local-dev demo keys (tied to 127.0.0.1 and the demo JWT
 * secret in supabase/config.toml) — not production secrets, same values
 * already committed in .env.local and the CI workflow. Falls back to them
 * here so these tests also run outside CI without extra setup.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

/** A service-role client for test setup/teardown that RLS would otherwise block. */
export function serviceRoleClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

/**
 * Signs in via the real OTP flow, then promotes the fresh profile to admin
 * directly through the service-role client — the same "no policy lets you
 * do this over the wire" path documented in 0002_profiles.sql, just from a
 * test instead of the Supabase SQL editor.
 */
export async function signInAsAdmin(page: Page, email: string): Promise<void> {
  await signInWithEmailOtp(page, email);

  const admin = serviceRoleClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("email", email);
  if (error) throw new Error(`Failed to promote ${email} to admin: ${error.message}`);

  await page.goto("/admin");
}
