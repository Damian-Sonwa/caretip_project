/**
 * Dashboard Chart Loading Optimization Audit
 * Usage: node scripts/dashboard-chart-loading-audit.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const reportDir = path.join(process.cwd(), "test-results", "dashboard-chart-loading");

function fileKb(name) {
  if (!name) return null;
  const stat = fs.statSync(path.join(process.cwd(), "dist", "assets", name));
  return { rawKb: Math.round(stat.size / 1024), gzipEstimate: null };
}

function findAsset(prefix) {
  const assets = fs.existsSync(path.join(process.cwd(), "dist", "assets"))
    ? fs.readdirSync(path.join(process.cwd(), "dist", "assets"))
    : [];
  return assets.find((f) => f.startsWith(prefix) && f.endsWith(".js")) ?? null;
}

function chunkImportsRecharts(chunkFile) {
  if (!chunkFile) return null;
  const text = fs.readFileSync(path.join(process.cwd(), "dist", "assets", chunkFile), "utf8");
  return text.includes("vendor-recharts") || text.includes("recharts");
}

console.log("Building production bundle…");
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const bundle = {
  vendorRecharts: findAsset("vendor-recharts"),
  businessDashboard: findAsset("BusinessDashboard-"),
  businessCharts: findAsset("BusinessDashboardAnalyticsCharts-"),
  employeeDashboard: findAsset("EmployeeDashboard-"),
  employeeCharts: findAsset("EmployeeDashboardEarningsChart-"),
  adminDashboard: findAsset("AdminDashboard-"),
  adminCharts: findAsset("AdminDashboardAnalyticsCharts-"),
};

const analysis = {
  vendorRechartsKb: fileKb(bundle.vendorRecharts),
  routes: {
    business: {
      routeChunk: bundle.businessDashboard,
      routeKb: fileKb(bundle.businessDashboard),
      chartsChunk: bundle.businessCharts,
      chartsKb: fileKb(bundle.businessCharts),
      rechartsOnRouteSyncGraph: chunkImportsRecharts(bundle.businessDashboard),
    },
    employee: {
      routeChunk: bundle.employeeDashboard,
      routeKb: fileKb(bundle.employeeDashboard),
      chartsChunk: bundle.employeeCharts,
      chartsKb: fileKb(bundle.employeeCharts),
      rechartsOnRouteSyncGraph: chunkImportsRecharts(bundle.employeeDashboard),
    },
    admin: {
      routeChunk: bundle.adminDashboard,
      routeKb: fileKb(bundle.adminDashboard),
      chartsChunk: bundle.adminCharts,
      chartsKb: fileKb(bundle.adminCharts),
      rechartsOnRouteSyncGraph: chunkImportsRecharts(bundle.adminDashboard),
    },
  },
};

console.log(`Running dashboard init profile against ${baseUrl}…`);
const pw = spawnSync(
  "npx",
  ["playwright", "test", "e2e/dashboard-init-profile.spec.ts", "--project=chromium", "--workers=1", "--reporter=line"],
  {
    env: { ...process.env, E2E_BASE_URL: baseUrl, SKIP_PLAYWRIGHT_INSTALL: "true" },
    stdio: "inherit",
    shell: true,
  },
);

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  bundleAnalysis: analysis,
  optimization: "Lazy chart chunks via React.lazy + DashboardChartsIdleMount (120ms idle defer)",
  playwrightExit: pw.status ?? 1,
  note: "See test stdout for KPI vs chart vs interactive milestones per dashboard.",
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "dashboard-chart-loading-audit.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log("\n--- Dashboard Chart Loading Audit ---");
console.log(JSON.stringify(report, null, 2));

process.exit(pw.status ?? 1);
