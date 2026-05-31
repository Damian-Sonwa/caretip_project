/**
 * Capture landing hero screenshots (EN + DE) at audit breakpoints.
 * Usage: npm run dev then:
 *   node scripts/capture-hero-layout-screenshots.mjs
 *   PREFIX=before node scripts/capture-hero-layout-screenshots.mjs
 */
import { copyFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { chromium } from "@playwright/test";

const baseUrl = process.env.CARETIP_WEB_URL ?? "http://localhost:5173";
const outDir = "docs/hero-layout-audit";
const prefix = process.env.PREFIX === "before" ? "before" : "after";

const viewports = [
  { name: "320", width: 320, height: 700 },
  { name: "375", width: 375, height: 740 },
  { name: "768", width: 768, height: 900 },
  { name: "1024", width: 1024, height: 800 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
];

const locales = [
  { lang: "de", label: "de" },
  { lang: "en", label: "en" },
];

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const { lang, label } of locales) {
      await page.goto(`${baseUrl}/?lng=${lang}`, { waitUntil: "networkidle", timeout: 90_000 });
      await page.locator(".caretip-hero-section").waitFor({ state: "visible", timeout: 30_000 });
      await page.waitForTimeout(600);
      const file = `${outDir}/${prefix}-${label}-${vp.name}.png`;
      await page.locator(".caretip-hero-section").screenshot({ path: file });
      console.log("Wrote", file);
    }
  }

  await browser.close();

  if (prefix === "after") {
    for (const vp of viewports) {
      for (const { label } of locales) {
        const after = `${outDir}/after-${label}-${vp.name}.png`;
        const before = `${outDir}/before-${label}-${vp.name}.png`;
        if (!(await fileExists(before)) && (await fileExists(after))) {
          await copyFile(after, before);
          console.log("Seeded missing before from after:", before);
        }
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
