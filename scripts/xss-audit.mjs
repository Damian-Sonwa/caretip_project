/**
 * XSS regression static audit — frontend src/ + backend/src/.
 * Run: npm run test:xss-audit (repo root)
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ALLOWLIST_PATH = join(REPO_ROOT, "scripts/xss-audit.allowlist.json");

/** @type {{ domSinkAllowlist?: Array<{file:string;line:number,sink?:string}>, urlSchemeAllowlist?: Array<{file:string,line:number}>, richTextAllowlist?: string[] }} */
const ALLOWLIST = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));

const SCAN_ROOTS = [
  { label: "frontend", root: join(REPO_ROOT, "src") },
  { label: "backend", root: join(REPO_ROOT, "backend", "src") },
];

const DOM_SINK_RULES = [
  {
    id: "dangerouslySetInnerHTML",
    regex: /dangerouslySetInnerHTML\b/,
    remediation:
      "Avoid rendering HTML from strings. Use React text nodes, or DOMPurify + security review (see frontend/docs/XSS_SECURITY.md).",
  },
  {
    id: "innerHTML",
    regex: /\binnerHTML\b/,
    remediation:
      "Do not assign user or API strings to innerHTML. Use textContent or React {value} binding.",
  },
  {
    id: "outerHTML",
    regex: /\bouterHTML\b/,
    remediation: "Avoid outerHTML with dynamic content; use safe DOM APIs or React rendering.",
  },
  {
    id: "insertAdjacentHTML",
    regex: /\binsertAdjacentHTML\b/,
    remediation: "Use insertAdjacentText or React components instead of HTML insertion.",
  },
  {
    id: "document.write",
    regex: /\bdocument\.write\s*\(/,
    remediation:
      "Avoid document.write. If unavoidable, encode all dynamic parts (see qrBranded escapeHtml pattern).",
  },
  {
    id: "createContextualFragment",
    regex: /\bcreateContextualFragment\b/,
    remediation: "Parsing HTML strings into the DOM is unsafe with user content; use DOMPurify + allowlist.",
  },
];

const RICH_TEXT_IMPORTS = [
  "react-markdown",
  "marked",
  "markdown-it",
  "html-react-parser",
  "sanitize-html",
  "isomorphic-dompurify",
  "dompurify",
];

const UNSAFE_SCHEME_IN_STRING = [
  {
    id: "javascript-scheme",
    regex: /javascript\s*:/i,
    remediation: "Never build javascript: URLs. Use button onClick handlers instead.",
  },
  {
    id: "vbscript-scheme",
    regex: /vbscript\s*:/i,
    remediation: "vbscript: URLs are forbidden.",
  },
  {
    id: "data-html-scheme",
    regex: /data\s*:\s*text\s*\/\s*html/i,
    remediation: "data:text/html URLs can execute script in some contexts; use blob: or https: only.",
  },
  {
    id: "data-js-scheme",
    regex: /data\s*:\s*application\s*\/\s*javascript/i,
    remediation: "data:application/javascript URLs are forbidden.",
  },
];

const DYNAMIC_URL_PATTERNS = [
  {
    id: "dynamic-href-user-field",
    regex:
      /\bhref\s*=\s*\{[^}]*\b(website|actionUrl|externalUrl|userUrl|rawUrl|linkUrl|profileUrl|redirectUrl|targetUrl)\b[^}]*\}/i,
    remediation:
      "Validate URL scheme (https/mailto only) before href. Use a safeUrl helper or same-origin path builder.",
  },
  {
    id: "dynamic-src-user-field",
    regex:
      /\bsrc\s*=\s*\{[^}]*\b(website|actionUrl|externalUrl|userUrl|rawUrl|htmlContent|userHtml)\b[^}]*\}/i,
    remediation: "Never bind user HTML to src. Serve media from validated upload URLs only.",
  },
  {
    id: "window-location-dynamic",
    regex:
      /window\.location\.(?:href|assign|replace)\s*=\s*(?:[a-zA-Z_$][\w.$]*|`[^`]*\$\{)/,
    remediation:
      "Assign only literal paths, https:, or mailto: to window.location. Dynamic URLs must be allowlisted (e.g. Stripe Checkout).",
  },
];

/** @typedef {{ file: string, line: number, category: string, sink: string, remediation: string }} Violation */

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

function relFromRepo(absPath) {
  return normalizePath(relative(REPO_ROOT, absPath));
}

function isDomSinkAllowlisted(relPath, lineNo, sinkId) {
  return (ALLOWLIST.domSinkAllowlist ?? []).some(
    (e) => normalizePath(e.file) === relPath && e.line === lineNo && (!e.sink || e.sink === sinkId),
  );
}

function isUrlAllowlisted(relPath, lineNo) {
  return (ALLOWLIST.urlSchemeAllowlist ?? []).some(
    (e) => normalizePath(e.file) === relPath && e.line === lineNo,
  );
}

function isRichTextImportAllowlisted(moduleName) {
  return (ALLOWLIST.richTextAllowlist ?? []).includes(moduleName);
}

function stripComments(line) {
  const noBlock = line.replace(/\/\*.*?\*\//g, "");
  const idx = noBlock.indexOf("//");
  return idx >= 0 ? noBlock.slice(0, idx) : noBlock;
}

function listSourceFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      listSourceFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

/** @param {string} absPath @returns {Violation[]} */
function scanFile(absPath) {
  const relPath = relFromRepo(absPath);
  const violations = [];
  const lines = readFileSync(absPath, "utf8").split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const line = stripComments(lines[i] ?? "");
    if (!line.trim()) continue;

    for (const rule of DOM_SINK_RULES) {
      if (!rule.regex.test(line)) continue;
      if (isDomSinkAllowlisted(relPath, lineNo, rule.id)) continue;
      violations.push({
        file: relPath,
        line: lineNo,
        category: "dom-sink",
        sink: rule.id,
        remediation: rule.remediation,
      });
    }

    if (isUrlAllowlisted(relPath, lineNo)) continue;

    for (const rule of UNSAFE_SCHEME_IN_STRING) {
      if (!rule.regex.test(line)) continue;
      violations.push({
        file: relPath,
        line: lineNo,
        category: "unsafe-url-scheme",
        sink: rule.id,
        remediation: rule.remediation,
      });
    }

    for (const rule of DYNAMIC_URL_PATTERNS) {
      if (!rule.regex.test(line)) continue;
      violations.push({
        file: relPath,
        line: lineNo,
        category: "unsafe-url-scheme",
        sink: rule.id,
        remediation: rule.remediation,
      });
    }

    for (const mod of RICH_TEXT_IMPORTS) {
      const importRe = new RegExp(`from\\s+['"]${mod.replace("/", "\\/")}['"]|require\\(['"]${mod}['"]\\)`);
      if (!importRe.test(line)) continue;
      if (isRichTextImportAllowlisted(mod)) continue;
      violations.push({
        file: relPath,
        line: lineNo,
        category: "rich-text",
        sink: mod,
        remediation:
          "Markdown/HTML rendering requires DOMPurify, an HTML allowlist, and security review. See frontend/docs/XSS_SECURITY.md.",
      });
    }
  }

  return violations;
}

function main() {
  /** @type {Violation[]} */
  const all = [];
  let fileCount = 0;

  for (const { label, root } of SCAN_ROOTS) {
    const files = listSourceFiles(root);
    fileCount += files.length;
    for (const f of files) {
      all.push(...scanFile(f));
    }
    console.log(`Scanned ${files.length} ${label} file(s) under ${normalizePath(relative(REPO_ROOT, root))}/`);
  }

  console.log("\n=== XSS static audit ===\n");

  if (all.length === 0) {
    console.log(`PASS: No new unsafe XSS patterns in ${fileCount} file(s).`);
    console.log(`Allowlisted DOM sinks: ${(ALLOWLIST.domSinkAllowlist ?? []).length}`);
    console.log("\nOVERALL: PASS");
    process.exit(0);
  }

  console.log(`FAIL: ${all.length} violation(s):\n`);
  for (const v of all) {
    console.log(`${v.file}:${v.line}`);
    console.log(`  [${v.category}] ${v.sink}`);
    console.log(`  Remediation: ${v.remediation}\n`);
  }
  console.log("OVERALL: FAIL");
  process.exit(1);
}

main();
