import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getLatestOtp } from "./mailpit";

/**
 * Drives the real email-OTP flow end to end: request a code, read it back
 * from Mailpit, submit it. This is a genuine sign-up on the local Supabase
 * stack — `shouldCreateUser: true` means a fresh address always succeeds.
 */
export async function signInWithEmailOtp(page: Page, email: string): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();

  await expect(page.getByText(`We sent a 6-digit code to ${email}.`)).toBeVisible();

  const code = await getLatestOtp(email);
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify and continue" }).click();

  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/** A fresh, unique test address so each test run is independent. */
export function testEmail(scenario: string): string {
  return `e2e-${scenario}-${Date.now()}@example.com`;
}
