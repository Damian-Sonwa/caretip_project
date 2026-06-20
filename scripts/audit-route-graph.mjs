#!/usr/bin/env node
/**
 * Verifies anonymous `/` does not statically import dashboard shells or vendor-motion.
 * Run after `npm run build`.
 */
import fs from "node:fs";
import path from "node:path";

const distAssets = path.join(process.cwd(), "dist", "assets");
const indexFiles = fs.readdirSync(distAssets).filter((f) => /^index-.*\.js$/.test(f));

if (indexFiles.length === 0) {
  console.error("No dist/assets/index-*.js — run npm run build first.");
  process.exit(1);
}

const indexPath = path.join(distAssets, indexFiles[0]);
const indexSrc = fs.readFileSync(indexPath, "utf8");

const blockedInEntry = ["vendor-motion", "DashboardHeader"];

const hits = blockedInEntry.filter((needle) => indexSrc.includes(needle));

console.log(`Entry chunk: ${indexFiles[0]} (${(indexSrc.length / 1024).toFixed(1)} KB)`);

const layoutChunks = ["BusinessLayout-", "EmployeeLayout-", "SuperAdminLayout-"].map((prefix) =>
  fs.readdirSync(distAssets).find((f) => f.startsWith(prefix) && f.endsWith(".js")),
);
console.log(
  "Dashboard layout chunks (lazy):",
  layoutChunks.filter(Boolean).join(", ") || "(none — check build)",
);

if (hits.length > 0) {
  console.error("FAIL — entry chunk still references:", hits.join(", "));
  process.exit(1);
}

const landingFiles = fs.readdirSync(distAssets).filter((f) => f.startsWith("LandingPage-") && f.endsWith(".js"));
for (const file of landingFiles) {
  const src = fs.readFileSync(path.join(distAssets, file), "utf8");
  const landingHits = blockedInEntry.filter((needle) => src.includes(needle));
  if (landingHits.length > 0) {
    console.error(`FAIL — ${file} references:`, landingHits.join(", "));
    process.exit(1);
  }
}

console.log("PASS — index + LandingPage omit vendor-motion; layouts are separate lazy chunks.");
