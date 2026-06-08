/**
 * Second-pass dependency validation — exhaustive import detection.
 * Scans static/dynamic/lazy imports, subpaths, side-effect imports,
 * CSS imports, vite chunks, scripts, and route lazy entrypoints.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".json"]);

/** Packages flagged unused in first audit (Tier 1 removed + Tier 2/3 candidates). */
const CANDIDATES = [
  // Tier 1 — already removed from package.json
  "@emotion/react",
  "@emotion/styled",
  "@fontsource/plus-jakarta-sans",
  "@popperjs/core",
  "react-popper",
  "react-dnd",
  "react-dnd-html5-backend",
  "react-slick",
  "react-responsive-masonry",
  // Tier 2 — paste / artifact only
  "canvas-confetti",
  "@number-flow/react",
  "@types/canvas-confetti",
  // Tier 3 — orphan shadcn wrappers
  "input-otp",
  "vaul",
  "cmdk",
  "embla-carousel-react",
  "react-resizable-panels",
  "@radix-ui/react-menubar",
  "@radix-ui/react-navigation-menu",
  "@radix-ui/react-context-menu",
  "@radix-ui/react-hover-card",
  "@radix-ui/react-aspect-ratio",
  "@radix-ui/react-collapsible",
  // Dead-tree / demo-only flagged in audit
  "@splinetool/runtime",
  "gsap",
  "react-pageflip",
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    files.push(dir);
    return files;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".git") continue;
    walk(path.join(dir, ent.name), files);
  }
  return files;
}

const scanRoots = [
  "src",
  "scripts",
  "vite.config.ts",
  "eslint.config.js",
  "playwright.config.ts",
  "index.html",
  "tsconfig.json",
  "tsconfig.app.json",
];

const allFiles = [];
for (const root of scanRoots) {
  const p = path.join(ROOT, root);
  if (!fs.existsSync(p)) continue;
  if (fs.statSync(p).isFile()) allFiles.push(p);
  else walk(p, allFiles);
}

const sources = allFiles
  .filter((f) => exts.has(path.extname(f)) || !path.extname(f))
  .map((file) => ({ file: path.relative(ROOT, file), text: fs.readFileSync(file, "utf8") }));

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scriptsText = Object.values(pkg.scripts || {}).join("\n");

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build patterns for a package name (incl. subpath & side-effect). */
function patternsFor(name) {
  const esc = escapeRe(name);
  const base = name.split("/")[0].startsWith("@") ? name.split("/").slice(0, 2).join("/") : name.split("/")[0];
  const escBase = escapeRe(base);

  const patterns = [
    { label: "static-import", re: new RegExp(`(?:import|export)\\s+[^'"]*from\\s+['"]${escBase}(?:/[^'"]*)?['"]`, "g") },
    { label: "type-import", re: new RegExp(`import\\s+type\\s+[^'"]*from\\s+['"]${escBase}(?:/[^'"]*)?['"]`, "g") },
    { label: "side-effect-import", re: new RegExp(`import\\s+['"]${escBase}(?:/[^'"]*)?['"]`, "g") },
    { label: "dynamic-import", re: new RegExp(`import\\s*\\(\\s*['"]${escBase}(?:/[^'"]*)?['"]\\s*\\)`, "g") },
    { label: "lazy-import", re: new RegExp(`lazy\\s*\\(\\s*\\(\\s*\\)\\s*=>\\s*import\\s*\\(\\s*['"]${escBase}(?:/[^'"]*)?['"]`, "g") },
    { label: "require", re: new RegExp(`require\\s*\\(\\s*['"]${escBase}(?:/[^'"]*)?['"]\\s*\\)`, "g") },
    { label: "css-import", re: new RegExp(`@import\\s+['"]${escBase}(?:/[^'"]*)?['"]`, "g") },
    { label: "asset-copy", re: new RegExp(`${escBase}/files/`, "g") },
    { label: "node-modules-path", re: new RegExp(`node_modules/${escBase}`, "g") },
    { label: "vite-chunk-hint", re: new RegExp(`['"]${escBase}['"]|includes\\(['"]${escBase}`, "g") },
    { label: "string-mention", re: new RegExp(`['"]${esc}['"]`, "g") },
  ];

  // Scoped aliases
  if (name === "motion") {
    patterns.push({ label: "motion-react", re: /from\s+['"]motion\/react['"]/g });
  }
  if (name === "firebase") {
    patterns.push({ label: "firebase-subpath", re: /from\s+['"]firebase\/[^'"]+['"]/g });
  }

  return patterns;
}

function findHits(name) {
  const hits = [];
  const patterns = patternsFor(name);

  for (const { file, text } of sources) {
    for (const p of patterns) {
      p.re.lastIndex = 0;
      if (p.re.test(text)) {
        // capture first matching line for context
        const line = text.split("\n").find((l) => {
          p.re.lastIndex = 0;
          return p.re.test(l);
        });
        hits.push({
          file,
          kind: p.label,
          snippet: line?.trim().slice(0, 120) ?? "",
        });
        p.re.lastIndex = 0;
      }
    }
  }

  if (scriptsText.includes(name)) {
    hits.push({ file: "package.json#scripts", kind: "script-reference", snippet: "" });
  }

  // dedupe by file+kind
  const seen = new Set();
  return hits.filter((h) => {
    const k = `${h.file}|${h.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Trace lazy route entry files from routes.tsx / lazyPages.ts */
function collectRouteEntryFiles() {
  const entries = new Set();
  const lazyRe = /lazyDefault\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]/g;
  const routeImportRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const { file, text } of sources) {
    if (!file.includes("routes") && !file.includes("lazyPages")) continue;
    for (const re of [lazyRe, routeImportRe]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) entries.add(m[1]);
    }
  }
  return [...entries];
}

const routeEntries = collectRouteEntryFiles();

const results = CANDIDATES.map((name) => {
  const hits = findHits(name);
  const inPackageJson =
    name in (pkg.dependencies || {}) ||
    name in (pkg.devDependencies || {}) ||
    false;

  return {
    name,
    inPackageJson,
    hitCount: hits.length,
    confirmedUnused: hits.length === 0,
    hits: hits.slice(0, 8),
  };
});

const tier1Removed = results.filter((r) =>
  [
    "@emotion/react",
    "@emotion/styled",
    "@fontsource/plus-jakarta-sans",
    "@popperjs/core",
    "react-popper",
    "react-dnd",
    "react-dnd-html5-backend",
    "react-slick",
    "react-responsive-masonry",
  ].includes(r.name)
);

const stillInstalledUnused = results.filter((r) => r.inPackageJson && r.hitCount > 0);
const stillInstalledZeroHits = results.filter((r) => r.inPackageJson && r.hitCount === 0);
const removedValidated = tier1Removed.every((r) => r.confirmedUnused);

console.log(
  JSON.stringify(
    {
      scanFileCount: sources.length,
      routeLazyEntrypoints: routeEntries,
      tier1RemovedValidation: {
        allConfirmedZeroImports: removedValidated,
        packages: tier1Removed,
      },
      stillInPackageJson: {
        withImports: stillInstalledUnused,
        zeroImports: stillInstalledZeroHits.map((r) => r.name),
      },
      fullCandidateReport: results,
    },
    null,
    2
  )
);
