import { expect, test } from "@playwright/test";

import { testEmail } from "../helpers/auth";
import { signInAsAdmin } from "./helpers/admin-auth";

test("an admin can create a course and delete it from the list", async ({ page }) => {
  const email = testEmail("admin-course");
  await signInAsAdmin(page, email);

  const slug = `e2e-throwaway-${Date.now()}`;
  await page.goto("/admin/courses/new");
  // Field's required-asterisk span is aria-hidden but still shows up in the
  // accessible name in this browser/Playwright combination, so the label is
  // "Title*" not "Title" - matched with a trailing-asterisk-optional regex
  // rather than an exact string, and anchored so "Title" never matches
  // "Subtitle" (a real field on this same form).
  await page.getByLabel(/^Title\*?$/).fill("E2E Throwaway Course");
  await page.getByLabel(/^Slug\*?$/).fill(slug);
  // Required: courses_price_matches_free (0003_courses.sql) rejects a
  // non-free course with a zero price, which is what this form defaults to.
  await page.getByLabel("This is a free course").check();
  await page.getByRole("button", { name: "Create course" }).click();

  // upsertCourse redirects to the new course's own edit page on success.
  await page.waitForURL(/\/admin\/courses\/[0-9a-f-]{36}$/);

  await page.goto("/admin/courses");
  await expect(page.getByRole("link", { name: "E2E Throwaway Course" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("tr", { hasText: "E2E Throwaway Course" })
    .getByRole("button", { name: "Delete course" })
    .click();

  await expect(page.getByRole("link", { name: "E2E Throwaway Course" })).toHaveCount(0);
});
