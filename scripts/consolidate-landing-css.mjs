#!/usr/bin/env node
/**
 * Merge landing CSS files and dedupe identical rule blocks (same selector + declarations).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.join(__dirname, '..', 'src/styles');

function normalizeDecl(decl) {
  return decl
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .sort()
    .join(';');
}

function dedupeCss(css) {
  const seen = new Set();
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(css)) !== null) {
    out.push(css.slice(last, m.index));
    const prefix = m[1];
    const body = m[2];
    if (prefix.trim().startsWith('@')) {
      out.push(m[0]);
    } else {
      const selectors = prefix
        .split(',')
        .map((s) => s.trim().replace(/\s+/g, ' '))
        .filter(Boolean);
      const key = `${selectors.join(',')}|||${normalizeDecl(body)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(m[0]);
      }
    }
    last = re.lastIndex;
  }
  out.push(css.slice(last));
  return out.join('');
}

function mergeFiles(outFile, inputFiles, header) {
  const parts = inputFiles.map((f) => {
    const p = path.join(stylesDir, f);
    if (!fs.existsSync(p)) throw new Error(`Missing ${f}`);
    return fs.readFileSync(p, 'utf8').trim();
  });
  const merged = `${header}\n\n${parts.join('\n\n')}\n`;
  fs.writeFileSync(path.join(stylesDir, outFile), merged, 'utf8');
  console.log(`Wrote ${outFile} (${Math.round(merged.length / 1024 * 10) / 10} KB)`);
}

mergeFiles(
  'caretip-landing-hero.css',
  [
    'caretip-landing-hero-layout.css',
    'caretip-landing-hero-typography.css',
    'caretip-landing-hero-media.css',
    'caretip-landing-hero-visual-refine.css',
    'caretip-landing-hero-mobile-refine.css',
    'caretip-landing-hero-story.css',
  ],
  `/**
 * Landing hero — layout, typography, media, visual polish, mobile tweaks, story frames.
 * Consolidated from caretip-landing-hero-*.css (presentation only).
 */`,
);

mergeFiles(
  'caretip-landing-optical.css',
  ['caretip-landing-optical-audit.css', 'caretip-landing-mobile-optical-balance.css'],
  `/**
 * Landing optical balance — page-wide spacing, alignment, mobile polish, nav drawer.
 * Consolidated from caretip-landing-optical-audit.css + caretip-landing-mobile-optical-balance.css.
 */`,
);

// Append atmosphere to section-flow
const sectionFlowPath = path.join(stylesDir, 'caretip-landing-section-flow.css');
const atmosphere = fs.readFileSync(path.join(stylesDir, 'caretip-landing-atmosphere.css'), 'utf8').trim();
const sectionFlow = fs.readFileSync(sectionFlowPath, 'utf8');
if (!sectionFlow.includes('caretip-landing--premium')) {
  fs.writeFileSync(
    sectionFlowPath,
    `${sectionFlow.trim()}\n\n/* Canvas atmosphere (was caretip-landing-atmosphere.css) */\n${atmosphere}\n`,
    'utf8',
  );
  console.log('Appended atmosphere to caretip-landing-section-flow.css');
}

// Remove duplicate hospitality dark band from section-flow (kept in hospitality-refine)
const sectionFlowPath = path.join(stylesDir, 'caretip-landing-section-flow.css');
let sf = fs.readFileSync(sectionFlowPath, 'utf8');
const hospitalityDup = `\nhtml.dark .caretip-landing #built-for-hospitality.caretip-landing-hospitality {\n  background: linear-gradient(180deg, #171717 0%, #141414 48%, #171717 100%);\n}\n`;
if (sf.includes(hospitalityDup.trim())) {
  sf = sf.replace(hospitalityDup, '\n');
  fs.writeFileSync(sectionFlowPath, sf, 'utf8');
  console.log('Removed duplicate hospitality dark band from section-flow');
}

// Append testimonials into trust-metrics-refine
const testimonialsPath = path.join(stylesDir, 'caretip-landing-testimonials-refine.css');
const trustMetricsPath = path.join(stylesDir, 'caretip-landing-trust-metrics-refine.css');
const testimonials = fs.readFileSync(testimonialsPath, 'utf8').trim();
const trustMetrics = fs.readFileSync(trustMetricsPath, 'utf8');
if (!trustMetrics.includes('caretip-testimonials-panel')) {
  fs.writeFileSync(
    trustMetricsPath,
    `${trustMetrics.trim()}\n\n/* Testimonials (was caretip-landing-testimonials-refine.css) */\n${testimonials}\n`,
    'utf8',
  );
  console.log('Appended testimonials to caretip-landing-trust-metrics-refine.css');
}

console.log('Done.');
