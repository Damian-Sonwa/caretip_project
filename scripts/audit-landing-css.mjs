#!/usr/bin/env node
/**
 * Audit caretip-landing-*.css: sizes, selectors, duplicates, component mapping.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const stylesDir = path.join(root, 'src/styles');
const landingDir = path.join(root, 'src');

const landingCssFiles = fs
  .readdirSync(stylesDir)
  .filter((f) => f.startsWith('caretip-landing-') && f.endsWith('.css'))
  .sort();

function extractSelectors(css) {
  const selectors = new Set();
  const re = /([^{]+)\{/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith('@')) continue;
    raw.split(',').forEach((s) => {
      const sel = s.trim().replace(/\s+/g, ' ');
      if (sel) selectors.add(sel);
    });
  }
  return selectors;
}

function extractClassPrefixes(css) {
  const prefixes = new Set();
  const re = /\.([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const cls = m[1];
    const parts = cls.split('-');
    if (parts.length >= 2) {
      prefixes.add(parts.slice(0, 2).join('-'));
      if (parts.length >= 3) prefixes.add(parts.slice(0, 3).join('-'));
    }
  }
  return prefixes;
}

function scanComponents() {
  const dirs = [
    path.join(root, 'src/components/landing'),
    path.join(root, 'src/app/components/landing'),
    path.join(root, 'src/app/pages'),
  ];
  const classUsage = new Map();

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(tsx|jsx|ts|js)$/.test(ent.name)) {
        const content = fs.readFileSync(p, 'utf8');
        const re = /(?:className|class)=["'`{][^"'`}]*["'`}]|["'`]([a-z][a-z0-9-]*)["'`]/gi;
        const classes = new Set();
        const cnRe = /(?:className|class)(?:=\{[`"']|\s*=\s*[`"']|\s*:\s*[`"'])([^"'`}]+)/g;
        let m;
        while ((m = cnRe.exec(content)) !== null) {
          m[1].split(/\s+/).forEach((c) => {
            c = c.replace(/\$\{[^}]+\}/g, '').trim();
            if (c && /^[a-z]/.test(c)) classes.add(c);
          });
        }
        const literalRe = /["'`]([a-z][a-z0-9-]{2,})["'`]/g;
        while ((m = literalRe.exec(content)) !== null) {
          if (m[1].includes('-')) classes.add(m[1]);
        }
        if (classes.size) {
          classUsage.set(path.relative(root, p), classes);
        }
      }
    }
  }
  dirs.forEach(walk);
  return classUsage;
}

const fileData = landingCssFiles.map((file) => {
  const full = path.join(stylesDir, file);
  const css = fs.readFileSync(full, 'utf8');
  const selectors = extractSelectors(css);
  const prefixes = extractClassPrefixes(css);
  return {
    file,
    bytes: fs.statSync(full).size,
    selectors: [...selectors],
    prefixes: [...prefixes],
    css,
  };
});

const totalBytes = fileData.reduce((s, f) => s + f.bytes, 0);

// Duplicate selectors across files
const selectorToFiles = new Map();
for (const fd of fileData) {
  for (const sel of fd.selectors) {
    if (!selectorToFiles.has(sel)) selectorToFiles.set(sel, []);
    selectorToFiles.get(sel).push(fd.file);
  }
}
const duplicateSelectors = [...selectorToFiles.entries()]
  .filter(([, files]) => files.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

// Map components to CSS files via class prefix overlap
const componentUsage = scanComponents();
const fileToComponents = {};
for (const fd of fileData) {
  fileToComponents[fd.file] = new Set();
}
for (const [comp, classes] of componentUsage) {
  for (const cls of classes) {
    for (const fd of fileData) {
      if (fd.css.includes(`.${cls}`) || fd.css.includes(`.${cls} `) || fd.css.includes(`.${cls},`) || fd.css.includes(`.${cls}:`)) {
        fileToComponents[fd.file].add(comp);
      }
    }
  }
}

// Find identical rule blocks (same selector + same declarations)
function normalizeBlock(declarations) {
  return declarations
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .sort()
    .join(';');
}

const ruleBlocks = new Map();
for (const fd of fileData) {
  const re = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(fd.css)) !== null) {
    const sel = m[1].trim().replace(/\s+/g, ' ');
    if (sel.startsWith('@')) continue;
    const decl = normalizeBlock(m[2]);
    const key = `${sel}|||${decl}`;
    if (!ruleBlocks.has(key)) ruleBlocks.set(key, []);
    ruleBlocks.get(key).push(fd.file);
  }
}
const identicalRules = [...ruleBlocks.entries()].filter(([, files]) => files.length > 1);

console.log(JSON.stringify({
  summary: {
    fileCount: fileData.length,
    totalKB: Math.round(totalBytes / 1024 * 10) / 10,
    duplicateSelectorCount: duplicateSelectors.length,
    identicalRuleBlockCount: identicalRules.length,
  },
  files: fileData.map((fd) => ({
    file: fd.file,
    kb: Math.round(fd.bytes / 1024 * 10) / 10,
    selectorCount: fd.selectors.length,
    components: [...fileToComponents[fd.file]].sort(),
  })),
  topDuplicateSelectors: duplicateSelectors.slice(0, 40).map(([sel, files]) => ({ selector: sel, files })),
  identicalRulesSample: identicalRules.slice(0, 30).map(([key, files]) => {
    const [sel] = key.split('|||');
    return { selector: sel, files: [...new Set(files)] };
  }),
}, null, 2));
