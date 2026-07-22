import { expect, test } from "@playwright/test";

import { testEmail } from "../helpers/auth";
import { serviceRoleClient, signInAsAdmin } from "./helpers/admin-auth";

test("an admin can create a quiz with no attempts and delete it", async ({ page }) => {
  const email = testEmail("admin-quiz");
  await signInAsAdmin(page, email);

  const slug = `e2e-throwaway-quiz-${Date.now()}`;
  await page.goto("/admin/quizzes/new");
  // See courses.spec.ts for why this is a regex, not an exact string.
  await page.getByLabel(/^Title\*?$/).fill("E2E Throwaway Quiz");
  await page.getByLabel(/^Slug\*?$/).fill(slug);
  await page.getByRole("button", { name: "Create quiz" }).click();

  await page.waitForURL(/\/admin\/quizzes\/[0-9a-f-]{36}$/);

  await page.goto("/admin/quizzes");
  await expect(page.getByRole("link", { name: "E2E Throwaway Quiz" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("tr", { hasText: "E2E Throwaway Quiz" })
    .getByRole("button", { name: "Delete quiz" })
    .click();

  await expect(page.getByRole("link", { name: "E2E Throwaway Quiz" })).toHaveCount(0);
});

/**
 * Guards the exact scenario deleteQuiz() exists to prevent: quiz_attempts
 * cascades on quiz deletion with no FK restrict, so a hard delete would
 * silently wipe a student's score history. This proves the admin action
 * itself refuses, rather than trusting the database to catch it.
 */
test("a quiz with a recorded attempt refuses to delete", async ({ page }) => {
  const email = testEmail("admin-quiz-guard");
  await signInAsAdmin(page, email);

  const slug = `e2e-guarded-quiz-${Date.now()}`;
  await page.goto("/admin/quizzes/new");
  await page.getByLabel(/^Title\*?$/).fill("E2E Guarded Quiz");
  await page.getByLabel(/^Slug\*?$/).fill(slug);
  await page.getByRole("button", { name: "Create quiz" }).click();
  await page.waitForURL(/\/admin\/quizzes\/([0-9a-f-]{36})$/);
  const quizId = new URL(page.url()).pathname.split("/").pop()!;

  const admin = serviceRoleClient();
  const { data: student, error: studentError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();
  if (studentError || !student)
    throw new Error("Could not find the test student profile");

  const { error: attemptError } = await admin
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, user_id: student.id });
  if (attemptError)
    throw new Error(`Failed to seed a quiz attempt: ${attemptError.message}`);

  try {
    await page.goto("/admin/quizzes");
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("tr", { hasText: "E2E Guarded Quiz" })
      .getByRole("button", { name: "Delete quiz" })
      .click();

    await expect(page.getByText(/cannot be deleted/)).toBeVisible();
    await expect(page.getByRole("link", { name: "E2E Guarded Quiz" })).toBeVisible();
  } finally {
    // The point of the test was the refusal, not leaving debris behind.
    await admin.from("quiz_attempts").delete().eq("quiz_id", quizId);
    await admin.from("quizzes").delete().eq("id", quizId);
  }
});
