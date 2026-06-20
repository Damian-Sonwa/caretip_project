import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join("test-results", "landing-hero-spacing", "screenshots");

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 700 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-430", width: 430, height: 860 },
  { name: "desktop-1280", width: 1280, height: 800 },
] as const;

test.describe("Landing hero spacing polish", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const viewport of VIEWPORTS) {
    test(`capture hero copy — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".caretip-hero-copy-block", { timeout: 20_000 });

      const copy = page.locator(".caretip-hero-copy-block");
      await expect(copy).toBeVisible();

      const spacing = await copy.evaluate(() => {
        const headline = document.querySelector(".caretip-hero-headline");
        const subtitle = document.querySelector(".caretip-hero-subtitle.caretip-landing-copy-paragraphs");
        const cta = document.querySelector(".caretip-hero-cta-cluster");
        const paras = subtitle?.querySelectorAll("p") ?? [];

        const rect = (el: Element | null) => el?.getBoundingClientRect();

        const h = rect(headline);
        const s = rect(subtitle);
        const c = rect(cta);
        const p0 = rect(paras[0] ?? null);
        const p1 = rect(paras[1] ?? null);

        return {
          headlineToBodyPx: h && s ? Math.round(s.top - h.bottom) : null,
          paragraphGapPx:
            p0 && p1 ? Math.round(p1.top - p0.bottom) : null,
          bodyToCtaPx: s && c ? Math.round(c.top - s.bottom) : null,
          bodyMaxWidthPx: subtitle ? Math.round(subtitle.getBoundingClientRect().width) : null,
        };
      });

      expect(spacing.headlineToBodyPx).toBeGreaterThanOrEqual(22);
      expect(spacing.bodyToCtaPx).toBeGreaterThanOrEqual(26);
      if (spacing.paragraphGapPx != null) {
        expect(spacing.paragraphGapPx).toBeGreaterThanOrEqual(18);
        expect(spacing.paragraphGapPx).toBeLessThanOrEqual(24);
      }

      await copy.screenshot({
        path: path.join(OUT_DIR, `hero-copy--${viewport.name}.png`),
      });
    });
  }
});
