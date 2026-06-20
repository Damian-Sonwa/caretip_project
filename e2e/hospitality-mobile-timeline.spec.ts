import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(
  "test-results",
  "hospitality-mobile-timeline",
  "screenshots",
);

const MOBILE_WIDTHS = [320, 375, 430] as const;

async function loadWhyCareTip(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".caretip-hero-section", { timeout: 20_000 });
  await page.waitForTimeout(1200);

  for (let pass = 0; pass < 12; pass += 1) {
    const found = await page.locator("#built-for-hospitality").count();
    if (found > 0) break;
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
    await page.waitForTimeout(450);
  }

  const section = page.locator("#built-for-hospitality");
  await expect(section).toBeAttached({ timeout: 25_000 });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return section;
}

test.describe("Why CareTip mobile timeline cleanup", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const width of MOBILE_WIDTHS) {
    test(`layout at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const section = await loadWhyCareTip(page);

      const timelineVisible = await section
        .locator(".caretip-hospitality-feature-timeline")
        .first()
        .evaluate((el) => getComputedStyle(el).display !== "none")
        .catch(() => false);

      expect(timelineVisible).toBe(false);

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(overflow).toBe(false);

      const featureNav = section.locator(".caretip-hospitality-feature-nav");
      await featureNav.screenshot({
        path: path.join(OUT_DIR, `why-caretip-feature-nav--${width}px.png`),
      });
    });
  }
});
