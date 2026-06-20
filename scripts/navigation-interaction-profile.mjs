/**
 * Navigation Interaction Profiling Audit
 * Measures pointerdown → handler → navigate → paint → interactive for all nav targets.
 *
 * Prerequisite: dev or preview server running (default http://localhost:5173).
 * Usage: node scripts/navigation-interaction-profile.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const reportDir = path.join(process.cwd(), "test-results", "nav-interaction-profile");

const result = spawnSync(
  "npx",
  [
    "playwright",
    "test",
    "e2e/navigation-interaction-profile.spec.ts",
    "--project=chromium",
    "--workers=1",
    "--reporter=line",
  ],
  {
    env: { ...process.env, E2E_BASE_URL: baseUrl, SKIP_PLAYWRIGHT_INSTALL: "true" },
    stdio: "inherit",
    shell: true,
  },
);

function readJson(name) {
  const file = path.join(reportDir, name);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const desktop = readJson("desktop-nav-profile.json");
const mobile = readJson("mobile-nav-profile.json");

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  exitCode: result.status ?? 1,
  desktopSummary: desktop?.summary ?? null,
  mobileSummary: mobile?.summary ?? null,
  reportDir: "test-results/nav-interaction-profile",
  tracesNote:
    "Open *.zip traces in chrome://tracing or Playwright trace viewer for Chrome Performance timeline.",
};

console.log("\n--- Navigation Interaction Profiling Audit ---");
console.log(JSON.stringify(report, null, 2));

process.exit(result.status ?? 1);
