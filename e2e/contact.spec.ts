import { expect, test } from "@playwright/test";

test("a visitor can submit the contact form", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Email address").fill(`e2e-contact-${Date.now()}@example.com`);
  await page
    .getByLabel("Message")
    .fill("This is an automated end-to-end test message from Playwright.");

  await page.getByRole("button", { name: /Send message/i }).click();

  await expect(page.getByText(/we've got your message/i)).toBeVisible();
});
