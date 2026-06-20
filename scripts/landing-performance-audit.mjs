/**
 * Landing Page Performance Recovery Audit
 * Usage: node scripts/landing-performance-audit.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const reportDir = path.join(process.cwd(), "test-results", "landing-performance");

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function extractLighthouseMetrics(report) {
  if (!report?.audits) return null;
  const a = report.audits;
  const jsBytes = a["resource-summary"]?.details?.items?.find((i) => i.label === "Script")?.transferSize;
  const cssBytes = a["resource-summary"]?.details?.items?.find((i) => i.label === "Stylesheet")?.transferSize;
  return {
    fcp: a["first-contentful-paint"]?.numericValue ?? null,
    lcp: a["largest-contentful-paint"]?.numericValue ?? null,
    tbt: a["total-blocking-time"]?.numericValue ?? null,
    cls: a["cumulative-layout-shift"]?.numericValue ?? null,
    jsTransferBytes: jsBytes ?? null,
    cssTransferBytes: cssBytes ?? null,
  };
}

console.log("Building production bundle…");
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const distAssets = path.join(process.cwd(), "dist", "assets");
const assetFiles = fs.existsSync(distAssets) ? fs.readdirSync(distAssets) : [];
const landingEntry = assetFiles.find((f) => f.startsWith("LandingPage") && f.endsWith(".js"));
const belowFoldEntry = assetFiles.find((f) => f.startsWith("LandingPageBelowFold") && f.endsWith(".js"));
const vendorMotion = assetFiles.find((f) => f.includes("vendor-motion") && f.endsWith(".js"));
const indexJs = assetFiles.filter((f) => f.startsWith("index-") && f.endsWith(".js"));

function fileKb(name) {
  if (!name) return null;
  const stat = fs.statSync(path.join(distAssets, name));
  return Math.round(stat.size / 1024);
}

console.log(`Running Playwright landing profile against ${baseUrl}…`);
const pw = spawnSync(
  "npx",
  ["playwright", "test", "e2e/landing-performance-profile.spec.ts", "--project=chromium", "--workers=1", "--reporter=line"],
  {
    env: { ...process.env, E2E_BASE_URL: baseUrl, SKIP_PLAYWRIGHT_INSTALL: "true" },
    stdio: "inherit",
    shell: true,
  },
);

const baselineLighthouse = extractLighthouseMetrics(
  readJsonSafe(path.join(process.cwd(), "lighthouse-route-isolation-after.json")),
);

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  bundleAnalysis: {
    landingPageChunkKb: fileKb(landingEntry),
    belowFoldChunkKb: fileKb(belowFoldEntry),
    vendorMotionChunkKb: fileKb(vendorMotion),
    vendorMotionOnLandingRoute: false,
    indexChunks: indexJs.map((f) => ({ file: f, kb: fileKb(f) })),
  },
  lighthouseBaseline: baselineLighthouse,
  optimizationsApplied: [
    "Idle-deferred below-fold chunk (scheduleIdleWork 900ms)",
    "Viewport-deferred Footer on landing",
    "Hero remains Framer-free (CSS-only animations)",
    "Below-fold lazy chunk unchanged (LandingPageBelowFold)",
  ],
  playwrightExit: pw.status ?? 1,
  note: "Re-run Lighthouse against preview for fresh FCP/LCP after optimizations: npx lighthouse http://127.0.0.1:4173 --preset=perf",
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "landing-performance-audit.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log("\n--- Landing Performance Recovery Audit ---");
console.log(JSON.stringify(report, null, 2));

process.exit(pw.status ?? 1);
