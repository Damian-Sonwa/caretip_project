/**
 * Scans source for t("key") usage and compares against en.json / de.json.
 * Run: node scripts/i18n-integrity-audit.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, relative, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "src/i18n/locales");

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const en = flatten(JSON.parse(readFileSync(join(localesDir, "en.json"), "utf8")));
const de = flatten(JSON.parse(readFileSync(join(localesDir, "de.json"), "utf8")));

const exts = new Set([".ts", ".tsx"]);
const keyRe = /\bt\s*\(\s*["'`]([^"'`$]+)["'`]/g;
const keysUsed = new Map();

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p);
    } else if (exts.has(extname(name))) {
      const text = readFileSync(p, "utf8");
      let m;
      while ((m = keyRe.exec(text))) {
        const k = m[1].trim();
        if (!k || k.includes("{{")) continue;
        if (!keysUsed.has(k)) keysUsed.set(k, []);
        keysUsed.get(k).push(relative(root, p).replace(/\\/g, "/"));
      }
    }
  }
}

walk(join(root, "src"));

const missingEn = [];
const missingDe = [];
for (const k of [...keysUsed.keys()].sort()) {
  const pluralBase = k.replace(/_(zero|one|two|few|many|other)$/, "");
  const enOk = k in en || pluralBase in en || `${pluralBase}_one` in en || `${pluralBase}_other` in en;
  const deOk = k in de || pluralBase in de || `${pluralBase}_one` in de || `${pluralBase}_other` in de;
  if (!enOk) missingEn.push({ key: k, files: keysUsed.get(k) });
  if (!deOk) missingDe.push({ key: k, files: keysUsed.get(k) });
}

const deOnlyMissing = missingDe.filter(({ key }) => key in en);

console.log(`Keys referenced in source: ${keysUsed.size}`);
console.log(`Missing in en.json: ${missingEn.length}`);
console.log(`Missing in de.json: ${missingDe.length}`);
console.log(`Present in en but missing in de: ${deOnlyMissing.length}`);

const report = {
  generatedAt: new Date().toISOString(),
  stats: {
    keysReferenced: keysUsed.size,
    missingEn: missingEn.length,
    missingDe: missingDe.length,
    enOnlyInDeGap: deOnlyMissing.length,
  },
  missingEn,
  missingDe,
  deOnlyMissingFromEn: deOnlyMissing,
};

writeFileSync(join(root, "i18n-integrity-audit.json"), JSON.stringify(report, null, 2));

if (missingEn.length) {
  console.log("\n--- Missing EN (first 40) ---");
  for (const { key, files } of missingEn.slice(0, 40)) {
    console.log(`  ${key}  ← ${files[0]}`);
  }
}

if (deOnlyMissing.length) {
  console.log("\n--- In EN but missing DE (first 40) ---");
  for (const { key } of deOnlyMissing.slice(0, 40)) {
    console.log(`  ${key}`);
  }
}

process.exit(missingEn.length > 0 ? 1 : 0);
