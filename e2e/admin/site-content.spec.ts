import { expect, test } from "@playwright/test";

import { testEmail } from "../helpers/auth";
import { signInAsAdmin } from "./helpers/admin-auth";

test("an admin can add, edit and delete a partner", async ({ page }) => {
  const email = testEmail("admin-partner");
  await signInAsAdmin(page, email);
  await page.goto("/admin/site-content");

  const manager = page.getByTestId("partners-manager");
  await manager.getByRole("button", { name: "Add partner" }).click();
  await manager.getByLabel("Name").fill("E2E Test Partner");
  await manager
    .getByLabel("Logo URL")
    .fill("https://res.cloudinary.com/demo/image/upload/e2e-test.png");
  await manager.getByRole("button", { name: "Save" }).click();

  await expect(manager.getByText("E2E Test Partner")).toBeVisible();

  const row = manager.locator("li", { hasText: "E2E Test Partner" });
  await row.getByRole("button", { name: "Edit" }).click();
  await manager.getByLabel("Name").fill("E2E Renamed Partner");
  await manager.getByRole("button", { name: "Save" }).click();

  await expect(manager.getByText("E2E Renamed Partner")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await manager
    .locator("li", { hasText: "E2E Renamed Partner" })
    .getByRole("button", { name: "Delete partner" })
    .click();

  await expect(manager.getByText("E2E Renamed Partner")).toHaveCount(0);
});

test("an admin can add and delete a moments photo", async ({ page }) => {
  const email = testEmail("admin-highlight");
  await signInAsAdmin(page, email);
  await page.goto("/admin/site-content");
  await page.getByRole("button", { name: "Moments photos" }).click();

  const manager = page.getByTestId("highlights-manager");
  await manager.getByRole("button", { name: "Add photo" }).click();
  await manager
    .getByLabel("Photo URL")
    .fill("https://res.cloudinary.com/demo/image/upload/e2e-highlight.jpg");
  await manager.getByLabel("Caption").fill("E2E Test Highlight");
  await manager.getByRole("button", { name: "Save" }).click();

  await expect(manager.getByText("E2E Test Highlight")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await manager
    .locator("li", { hasText: "E2E Test Highlight" })
    .getByRole("button", { name: "Delete photo" })
    .click();

  await expect(manager.getByText("E2E Test Highlight")).toHaveCount(0);
});

test("an admin can update the founder profile and see it reflected on /about", async ({
  page,
}) => {
  const email = testEmail("admin-founder");
  await signInAsAdmin(page, email);
  await page.goto("/admin/site-content");
  await page.getByRole("button", { name: "Founder profile" }).click();

  const form = page.getByTestId("founder-profile-form");
  const marker = `E2E bio marker ${Date.now()}`;
  await form.getByLabel("Bio").fill(`${marker}\n\nSecond paragraph for the e2e test.`);
  await form.getByRole("button", { name: "Save profile" }).click();

  await expect(form.getByText("Saved.")).toBeVisible();

  await page.goto("/about");
  await expect(page.getByText(marker)).toBeVisible();
});
