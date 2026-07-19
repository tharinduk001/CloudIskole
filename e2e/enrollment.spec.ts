import { expect, test } from "@playwright/test";

import { signInWithEmailOtp, testEmail } from "./helpers/auth";

/** Seeded in supabase/seed.sql — a published, free course. */
const FREE_COURSE_SLUG = "cloud-foundations";

test("a signed-in student can enrol in a free course and start learning", async ({
  page,
}) => {
  const email = testEmail("enroll");
  await signInWithEmailOtp(page, email);

  await page.goto(`/courses/${FREE_COURSE_SLUG}`);
  await page.getByRole("button", { name: "Enrol for free" }).click();

  // The server action revalidates the page, so it re-renders straight into
  // the "enrolled" state (progress bar + "Continue learning") rather than
  // the button's own transient "Start learning" success state.
  await expect(page.getByText("Your progress")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue learning" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Cloud Foundations")).toBeVisible();
});
