import { defineConfig, devices } from "@playwright/test";

/**
 * E2E expects the Vite app already running unless you opt in:
 *   PowerShell: `$env:E2E_START_WEBSERVER='1'; npm run test:e2e`
 *   cmd.exe:     `set E2E_START_WEBSERVER=1&& npm run test:e2e`
 *
 * Default is NO auto `webServer` — spawning `npm run dev` here often looks “stuck”
 * (slow first compile, port 5173 in use, or Playwright waiting on the wrong host).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const startWebServer = process.env.E2E_START_WEBSERVER === "1";

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
  webServer: startWebServer
    ? {
        command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
