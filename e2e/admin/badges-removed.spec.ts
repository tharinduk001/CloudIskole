import { expect, test } from "@playwright/test";

import { testEmail } from "../helpers/auth";
import { signInAsAdmin } from "./helpers/admin-auth";

/**
 * Regression guard for the badges admin removal: the nav link, the route,
 * and the page must all stay gone. The underlying gamification system (XP,
 * streaks, auto-awarded badges, the leaderboard) is untouched and covered
 * elsewhere — this only asserts the admin management surface is gone.
 */
test("the badges admin nav link and route no longer exist", async ({ page }) => {
  const email = testEmail("admin-badges");
  await signInAsAdmin(page, email);

  await expect(page.getByRole("link", { name: "Badges" })).toHaveCount(0);

  await page.goto("/admin/badges");
  await expect(page.getByText("We could not find that page")).toBeVisible();
});
