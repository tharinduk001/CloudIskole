import { expect, test } from "@playwright/test";

import { signInWithEmailOtp, testEmail } from "./helpers/auth";

test("a new student can sign up with email OTP and lands on the dashboard", async ({
  page,
}) => {
  const email = testEmail("auth");

  await signInWithEmailOtp(page, email);

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("signing in redirects a signed-in visitor away from /sign-in", async ({ page }) => {
  const email = testEmail("auth-redirect");
  await signInWithEmailOtp(page, email);

  await page.goto("/sign-in");
  await page.waitForURL("**/dashboard");
});
