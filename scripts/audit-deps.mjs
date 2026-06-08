import fs from "fs";
import path from "path";

const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const backendPkg = JSON.parse(fs.readFileSync("backend/package.json", "utf8"));

const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    files.push(dir);
    return files;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "dist") continue;
    walk(path.join(dir, ent.name), files);
  }
  return files;
}

function readTree(roots) {
  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    if (fs.statSync(root).isFile()) files.push(root);
    else walk(root, files);
  }
  return files
    .filter((f) => exts.has(path.extname(f)))
    .map((f) => ({ file: f, text: fs.readFileSync(f, "utf8") }))
    .filter(({ file }) => !file.includes(`${path.sep}imports${path.sep}`));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectUsage(name, entries, scripts = "") {
  const hits = [];
  const checks = [
    { re: new RegExp(`from ['"]${escapeRe(name)}['"]`, "g"), label: "import" },
    { re: new RegExp(`import\\(['"]${escapeRe(name)}['"]\\)`, "g"), label: "dynamic-import" },
    { re: new RegExp(`require\\(['"]${escapeRe(name)}['"]\\)`, "g"), label: "require" },
    { re: new RegExp(`@import ['"]${escapeRe(name)}`, "g"), label: "css-import" },
    { re: new RegExp(`${escapeRe(name)}/files/`, "g"), label: "asset-copy" },
    { re: new RegExp(`${escapeRe(name)}/dist/`, "g"), label: "dist-import" },
  ];

  if (name === "motion") {
    checks.push({ re: /from ['"]motion\/react['"]/g, label: "import" });
  }
  if (name === "framer-motion") {
    checks.push({ re: /from ['"]framer-motion['"]/g, label: "import" });
  }
  if (name === "react-router") {
    checks.push({ re: /from ['"]react-router-dom['"]/g, label: "import" });
  }
  if (name === "vite-plugin-pwa") {
    checks.push({ re: /from ['"]vite-plugin-pwa['"]/g, label: "config" });
    checks.push({ re: /VitePWA/g, label: "config" });
  }

  if (scripts.includes(name)) hits.push({ file: "package.json scripts", label: "scripts" });

  for (const { file, text } of entries) {
    for (const check of checks) {
      if (check.re.test(text)) {
        hits.push({ file, label: check.label });
      }
      check.re.lastIndex = 0;
    }
  }

  return hits;
}

const rootEntries = readTree(["src", "scripts", "vite.config.ts", "eslint.config.js", "playwright.config.ts", "index.html", "src/styles"]);
const backendEntries = readTree(["backend/src", "backend/scripts", "backend/prisma"]);

function auditPkg(pkg, entries, scripts, label) {
  const out = { label, dependencies: [], devDependencies: [] };
  for (const kind of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(pkg[kind] || {})) {
      const hits = detectUsage(name, entries, scripts);
      out[kind].push({
        name,
        version: pkg[kind][name],
        used: hits.length > 0,
        hits: hits.slice(0, 5),
        hitCount: hits.length,
      });
    }
  }
  return out;
}

const rootAudit = auditPkg(rootPkg, rootEntries, Object.values(rootPkg.scripts || {}).join(" "), "frontend");
const backendAudit = auditPkg(
  backendPkg,
  backendEntries,
  Object.values(backendPkg.scripts || {}).join(" "),
  "backend"
);

// Radix: map which @radix-ui packages are imported via ui wrappers
const radixUsed = new Set();
for (const { text } of rootEntries) {
  const m = text.matchAll(/@radix-ui\/react-[a-z-]+/g);
  for (const match of m) radixUsed.add(match[0]);
}

console.log(
  JSON.stringify(
    {
      rootAudit,
      backendAudit,
      radixPrimitivesReferenced: [...radixUsed].sort(),
      radixDeclared: Object.keys(rootPkg.dependencies || {}).filter((d) => d.startsWith("@radix-ui/")).sort(),
    },
    null,
    2
  )
);
