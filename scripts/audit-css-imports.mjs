#!/usr/bin/env node
/**
 * CSS isolation audit — source files + built landing critical path.
 * Run: node scripts/audit-css-imports.mjs
 * After build: node scripts/audit-css-imports.mjs --built
 */
import { readFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = join(root, "src/styles");
const built = process.argv.includes("--built");

const CATEGORIES = {
  "Landing Critical": ["core.css", "landing.css", "tailwind-landing.css", "fonts.css", "globals.css", "caretip-typography.css", "caretip-polish.css", "caretip-optical-balance.css", "caretip-brand.css", "caretip-buttons.css", "theme.css"],
  "Landing Below Fold": [],
  "Auth": ["auth-styles.css", "caretip-auth.css"],
  "Onboarding": ["caretip-onboarding.css"],
  "Dashboard": ["dashboard-styles.css", "business-dashboard-polish.css", "dashboard-desktop-layout.css", "dashboard-ecosystem-polish.css"],
  "Employee": [],
  "Platform Admin": [],
  "Shared (deferred app Tailwind)": ["app-tailwind.css", "tailwind-app.css"],
};

function categorize(file) {
  if (file.includes("landing-hero") || file.includes("landing-atmosphere") || file.includes("landing-hero")) {
    return "Landing Critical";
  }
  if (file.includes("landing")) return "Landing Below Fold";
  if (file.includes("auth") && !file.includes("onboarding")) return "Auth";
  if (file.includes("onboarding")) return "Onboarding";
  if (file.includes("dashboard") || file.includes("business-dashboard")) return "Dashboard";
  if (file.startsWith("tailwind-landing")) return "Landing Critical";
  if (file.startsWith("tailwind-app") || file.startsWith("app-tailwind")) return "Shared (deferred app Tailwind)";
  if (["fonts.css", "globals.css", "caretip-typography.css", "caretip-polish.css", "caretip-optical-balance.css", "caretip-brand.css", "caretip-buttons.css", "theme.css", "core.css", "landing.css"].includes(file)) {
    return "Landing Critical";
  }
  return "Shared (deferred app Tailwind)";
}

function parseImports(entryFile) {
  const text = readFileSync(join(stylesDir, entryFile), "utf8");
  return [...text.matchAll(/@import\s+["']\.\/([^"']+)/g)].map((m) => m[1]);
}

function fileKb(name) {
  const p = join(stylesDir, name);
  if (!existsSync(p)) return 0;
  return statSync(p).size / 1024;
}

const entryLanding = ["core.css", "landing.css"];
const entryImports = entryLanding.flatMap((f) => parseImports(f));
const deferredAuth = parseImports("auth-styles.css");
const deferredDashboard = parseImports("dashboard-styles.css");
const deferredApp = parseImports("app-tailwind.css");

const allTracked = [...new Set([...entryImports, ...deferredAuth, ...deferredDashboard, ...deferredApp, "tailwind-landing.css", "tailwind-app.css"])];

const report = allTracked.map((file) => {
  const cat = categorize(file);
  const onLanding = entryImports.includes(file) || file === "tailwind-landing.css";
  const authOnly = deferredAuth.includes(file) || file === "tailwind-app.css" || file === "app-tailwind.css";
  const dashboardOnly = deferredDashboard.includes(file);
  return {
    file,
    sourceKb: Number(fileKb(file).toFixed(1)),
    category: cat,
    onLandingRoute: onLanding,
    authRoutesOnly: authOnly && !onLanding,
    dashboardRoutesOnly: dashboardOnly,
    shouldNotLoadOnSlash: !onLanding,
  };
}).sort((a, b) => b.sourceKb - a.sourceKb);

const landingKb = report.filter((r) => r.onLandingRoute).reduce((s, r) => s + r.sourceKb, 0);
const removedFromSlashKb = report.filter((r) => r.shouldNotLoadOnSlash).reduce((s, r) => s + r.sourceKb, 0);

console.log("=== CSS Isolation Audit ===\n");
console.log(`Landing entry (core + landing): ${landingKb.toFixed(1)} KB source`);
console.log(`Deferred off / (auth + dashboard + app tailwind): ${removedFromSlashKb.toFixed(1)} KB source\n`);

console.log("Should NOT load on / (now deferred):");
report
  .filter((r) => r.shouldNotLoadOnSlash)
  .forEach((r) => console.log(`  ${r.sourceKb.toFixed(1).padStart(6)} KB  ${r.file}  [${r.category}]`));

console.log("\nLoads on / (landing critical path):");
report
  .filter((r) => r.onLandingRoute)
  .slice(0, 15)
  .forEach((r) => console.log(`  ${r.sourceKb.toFixed(1).padStart(6)} KB  ${r.file}`));
if (report.filter((r) => r.onLandingRoute).length > 15) {
  console.log(`  ... +${report.filter((r) => r.onLandingRoute).length - 15} more landing files`);
}

console.log("\n=== Tailwind scope ===");
console.log("tailwind-landing.css: landing tree + Navigation + Footer + shared ui/lib");
console.log("tailwind-app.css: full app scan (deferred via app-tailwind.css on route entry)");
console.log("Potential savings on /: entire app utility surface (~60–75% of built CSS was unused on landing per Lighthouse)");

if (built) {
  const dist = join(root, "dist/assets");
  if (!existsSync(dist)) {
    console.error("\nRun npm run build first for --built analysis");
    process.exit(1);
  }
  const cssFiles = readdirSync(dist).filter((f) => f.endsWith(".css"));
  const indexHtml = readFileSync(join(root, "dist/index.html"), "utf8");
  const linked = [...indexHtml.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  console.log("\n=== Built CSS (linked from index.html) ===");
  linked.forEach((href) => {
    const name = href.split("/").pop();
    const kb = statSync(join(dist, name)).size / 1024;
    console.log(`  ${kb.toFixed(1).padStart(7)} KB  ${name}`);
  });
  const blocked = ["auth", "onboarding", "dashboard", "app-tailwind"];
  const bad = linked.filter((href) => blocked.some((b) => href.includes(b)));
  if (bad.length) {
    console.error("\nFAIL — index.html links deferred CSS:", bad.join(", "));
    process.exit(1);
  }
  console.log("\nPASS — index.html links only landing/core CSS chunks");
  console.log("\nAll built CSS chunks:");
  cssFiles
    .map((f) => ({ f, kb: statSync(join(dist, f)).size / 1024 }))
    .sort((a, b) => b.kb - a.kb)
    .forEach(({ f, kb }) => console.log(`  ${kb.toFixed(1).padStart(7)} KB  ${f}`));
}
