import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/features", paint: "main h1", label: "Features" },
  { path: "/pricing", paint: "main h1", label: "Pricing" },
  { path: "/contact", paint: "#name, main h1", label: "Contact" },
] as const;

test.describe("Public route mount cost audit", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.__caretipMountCosts = [];
    });
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route.label} — rank component mount costs`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${route.path}?mountAudit=1`, { waitUntil: "domcontentloaded" });

      await page.waitForFunction(
        (selector) => {
          const parts = selector.split(",").map((s) => s.trim());
          return parts.some((sel) => {
            const el = document.querySelector(sel);
            return el && el.getBoundingClientRect().height > 0;
          });
        },
        route.paint,
        { timeout: 10_000 },
      );

      await page.waitForTimeout(500);

      const costs = await page.evaluate(() => {
        const ranked = [...(window.__caretipMountCosts ?? [])].sort((a, b) => b.ms - a.ms);
        return ranked.slice(0, 10);
      });

      console.log(
        JSON.stringify(
          {
            route: route.path,
            top10MountCosts: costs,
          },
          null,
          2,
        ),
      );

      expect(costs.length).toBeGreaterThan(0);
    });
  }
});
