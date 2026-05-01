import { defineConfig, devices } from "@playwright/test";

/**
 * Run E2E in one of two ways:
 * 1) Preferred: `npm run dev` in one terminal, then `npm run test:e2e` here (no auto server).
 * 2) One shot: `npm run test:e2e:with-server` — uses `scripts/playwright-with-server.mjs` (NOT Playwright `webServer`).
 *
 * `E2E_BASE_URL` overrides the app origin (default `http://localhost:5173`).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    navigationTimeout: 20_000,
    actionTimeout: 15_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
