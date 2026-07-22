import { expect, test } from "@playwright/test";

import { testEmail } from "../helpers/auth";
import { serviceRoleClient, signInAsAdmin } from "./helpers/admin-auth";

/** "2027-03-15T18:30" — a fixed future date, so this test is stable over time. */
const FUTURE_STARTS_AT = "2027-03-15T18:30";

test("an admin can create a session with no registrations and delete it", async ({
  page,
}) => {
  const email = testEmail("admin-session");
  await signInAsAdmin(page, email);

  const slug = `e2e-throwaway-session-${Date.now()}`;
  await page.goto("/admin/sessions/new");
  // See courses.spec.ts for why these are regexes, not exact strings.
  await page.getByLabel(/^Title\*?$/).fill("E2E Throwaway Session");
  await page.getByLabel(/^Slug\*?$/).fill(slug);
  await page.getByLabel(/^Starts at\*?$/).fill(FUTURE_STARTS_AT);
  await page.getByRole("button", { name: "Create session" }).click();

  await page.waitForURL(/\/admin\/sessions\/[0-9a-f-]{36}$/);

  await page.goto("/admin/sessions");
  await expect(page.getByRole("link", { name: "E2E Throwaway Session" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("tr", { hasText: "E2E Throwaway Session" })
    .getByRole("button", { name: "Delete session" })
    .click();

  await expect(page.getByRole("link", { name: "E2E Throwaway Session" })).toHaveCount(0);
});

/**
 * Guards the exact scenario deleteSession() exists to prevent:
 * session_registrations cascades on session deletion with no FK restrict, so
 * a hard delete would silently wipe student registration/attendance
 * history. This proves the admin action itself refuses.
 */
test("a session with a registration refuses to delete", async ({ page }) => {
  const email = testEmail("admin-session-guard");
  await signInAsAdmin(page, email);

  const slug = `e2e-guarded-session-${Date.now()}`;
  await page.goto("/admin/sessions/new");
  await page.getByLabel(/^Title\*?$/).fill("E2E Guarded Session");
  await page.getByLabel(/^Slug\*?$/).fill(slug);
  await page.getByLabel(/^Starts at\*?$/).fill(FUTURE_STARTS_AT);
  await page.getByRole("button", { name: "Create session" }).click();
  await page.waitForURL(/\/admin\/sessions\/([0-9a-f-]{36})$/);
  const sessionId = new URL(page.url()).pathname.split("/").pop()!;

  const admin = serviceRoleClient();
  const { data: student, error: studentError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();
  if (studentError || !student)
    throw new Error("Could not find the test student profile");

  const { error: registrationError } = await admin
    .from("session_registrations")
    .insert({ session_id: sessionId, user_id: student.id });
  if (registrationError) {
    throw new Error(`Failed to seed a registration: ${registrationError.message}`);
  }

  try {
    await page.goto("/admin/sessions");
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("tr", { hasText: "E2E Guarded Session" })
      .getByRole("button", { name: "Delete session" })
      .click();

    await expect(page.getByText(/cannot be deleted/)).toBeVisible();
    await expect(page.getByRole("link", { name: "E2E Guarded Session" })).toBeVisible();
  } finally {
    await admin.from("session_registrations").delete().eq("session_id", sessionId);
    await admin.from("sessions").delete().eq("id", sessionId);
  }
});
