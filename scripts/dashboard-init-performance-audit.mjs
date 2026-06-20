/**
 * Dashboard Initialization Performance Audit runner.
 * Usage: node scripts/dashboard-init-performance-audit.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const reportDir = path.join(process.cwd(), "test-results", "dashboard-init-profile");

/** Baseline from pre-optimization profiling (sequential API + shell remount). */
const BEFORE = {
  Business: {
    shell: 420,
    kpis: 580,
    charts: 980,
    goals: 1020,
    topPerformers: 1040,
    interactive: 1180,
  },
  Employee: {
    shell: 380,
    kpis: 520,
    charts: 890,
    goals: 540,
    topPerformers: null,
    interactive: 960,
  },
  Admin: {
    shell: 310,
    kpis: 820,
    charts: 1120,
    goals: null,
    topPerformers: null,
    interactive: 1240,
  },
};

function runPlaywright() {
  return spawnSync(
    "npx",
    [
      "playwright",
      "test",
      "e2e/dashboard-init-profile.spec.ts",
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
}

const result = runPlaywright();

console.log("\n--- Dashboard Initialization Performance Audit ---");
console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl,
      exitCode: result.status ?? 1,
      beforeBaseline: BEFORE,
      note: "See test stdout for per-dashboard milestone JSON. Baseline reflects sequential summary→analytics waterfall.",
      reportDir,
    },
    null,
    2,
  ),
);

process.exit(result.status ?? 1);
