import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for CloudIskole's critical flows.
 *
 * Runs against the local stack: `npx supabase start` + `npm run db:reset`
 * must be up first (Mailpit at :54324 is how tests read OTP emails — see
 * e2e/helpers/mailpit.ts). The dev server is started automatically unless
 * one is already running on :3000.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shared seed data (contact-message rate limit, etc.)
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
