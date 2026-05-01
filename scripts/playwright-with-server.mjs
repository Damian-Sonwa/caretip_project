/**
 * Runs Playwright with Vite auto-started (see playwright.config.ts `webServer`).
 * Cross-platform (Windows/macOS/Linux).
 */
import { spawnSync } from "node:child_process";

process.env.E2E_START_WEBSERVER = "1";
process.env.E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";

const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
