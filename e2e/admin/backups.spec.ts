import { expect, test } from "@playwright/test";

import { testEmail } from "../helpers/auth";
import { signInAsAdmin } from "./helpers/admin-auth";

test("an admin can see and reach the three backup exports", async ({ page }) => {
  const email = testEmail("admin-backups");
  await signInAsAdmin(page, email);
  await page.goto("/admin/audit");
  await page.getByRole("button", { name: "Backups" }).click();

  const database = page.getByRole("link", { name: "Download backup (.json)" });
  const auditLog = page.getByRole("link", { name: "Download audit log (.csv)" });
  const paymentLog = page.getByRole("link", { name: "Download payment log (.csv)" });
  await expect(database).toBeVisible();
  await expect(auditLog).toBeVisible();
  await expect(paymentLog).toBeVisible();

  // Fetch each export route directly (same session cookie) rather than
  // driving the browser's download UI, and check the response a real
  // download would get: 200, and a Content-Disposition attachment header
  // naming the file.
  for (const [href, filenamePattern] of [
    [await database.getAttribute("href"), /cloudiskole-backup-\d{4}-\d{2}-\d{2}\.json/],
    [await auditLog.getAttribute("href"), /audit-log-\d{4}-\d{2}-\d{2}\.csv/],
    [await paymentLog.getAttribute("href"), /payment-log-\d{4}-\d{2}-\d{2}\.csv/],
  ] as const) {
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    const disposition = response.headers()["content-disposition"] ?? "";
    expect(disposition).toContain("attachment");
    expect(disposition).toMatch(filenamePattern);
  }
});

test("a signed-out visitor is redirected away from the export routes", async ({
  page,
}) => {
  const response = await page.request.get("/admin/audit/export/database", {
    maxRedirects: 0,
  });
  expect([302, 307]).toContain(response.status());
  expect(response.headers()["location"] ?? "").toContain("/sign-in");
});
