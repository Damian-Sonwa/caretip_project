/**
 * Phase 4 Interaction Reduction Audit
 * Re-measures paint → fully interactive for Features, Pricing, Contact.
 *
 * Usage: node scripts/phase4-interaction-reduction-audit.mjs
 */
import { spawnSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const reportDir = path.join(process.cwd(), "test-results", "nav-interaction-profile");

const BEFORE = {
  Features: 258,
  Pricing: 200,
  Contact: 437,
};

const TARGETS = {
  Features: 150,
  Pricing: 150,
  Contact: 200,
};

function run(cmd, args, env = {}) {
  return spawnSync(cmd, args, {
    env: { ...process.env, ...env, SKIP_PLAYWRIGHT_INSTALL: "true" },
    stdio: "inherit",
    shell: true,
  });
}

function sleep(ms) {
  spawnSync("node", ["-e", `setTimeout(() => process.exit(0), ${ms})`], { stdio: "ignore", shell: true });
}

console.log("Building production preview bundle…");
const build = run("npm", ["run", "build"]);
if (build.status !== 0) process.exit(build.status ?? 1);

console.log(`Using preview at ${baseUrl}`);
const profile = run("npx", [
  "playwright",
  "test",
  "e2e/navigation-interaction-profile.spec.ts",
  "--project=chromium",
  "--grep",
  "desktop nav",
  "--workers=1",
  "--reporter=line",
], { E2E_BASE_URL: baseUrl });

console.log("Running public route mount audit…");
const mount = run("npx", [
  "playwright",
  "test",
  "e2e/public-route-mount-audit.spec.ts",
  "--project=chromium",
  "--workers=1",
  "--reporter=line",
], { E2E_BASE_URL: baseUrl });

function readDesktopProfile() {
  const file = path.join(reportDir, "desktop-nav-profile.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const desktop = readDesktopProfile();
const after = {};
for (const label of ["Features", "Pricing", "Contact"]) {
  const row = desktop?.profiles?.find((p) => p.label === label);
  after[label] = row?.phases?.firstPaintToInteractive ?? null;
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  targets: TARGETS,
  before: BEFORE,
  after,
  delta: Object.fromEntries(
    Object.keys(BEFORE).map((k) => [
      k,
      after[k] != null ? after[k] - BEFORE[k] : null,
    ]),
  ),
  passed: Object.entries(TARGETS).every(([k, max]) => (after[k] ?? Infinity) <= max),
  profileExit: profile.status ?? 1,
  mountExit: mount.status ?? 1,
};

console.log("\n--- Phase 4 Interaction Reduction Audit ---");
console.log(JSON.stringify(report, null, 2));

process.exit(report.passed && profile.status === 0 ? 0 : 1);
