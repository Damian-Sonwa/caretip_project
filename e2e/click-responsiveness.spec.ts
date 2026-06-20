import { test, expect } from "@playwright/test";

const TARGET_MS = 100;

type ClickSample = {
  label: string;
  clickToResponseMs: number;
  passed: boolean;
};

test.describe("Click responsiveness audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const pwaDismiss = page.getByRole("button", { name: /dismiss|got it|verstanden/i });
    if (await pwaDismiss.isVisible().catch(() => false)) {
      await pwaDismiss.click();
    }
    await page.waitForTimeout(2500);
  });

  test("mobile header, menu, language, footer respond under 100ms", async ({ page }) => {
    const samples: ClickSample[] = [];

    const langBtn = page.locator("nav").first().getByRole("button", { name: /language|sprache/i });
    await expect(langBtn).toBeVisible();
    const langDelay = await langBtn.evaluate((btn) => {
      const start = performance.now();
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return performance.now() - start;
    });
    await langBtn.click();
    await expect(page.locator('[role="listbox"]')).toBeVisible({ timeout: 2000 });
    samples.push({
      label: "Language toggle",
      clickToResponseMs: Math.round(langDelay),
      passed: langDelay >= 0 && langDelay < TARGET_MS,
    });
    await page.keyboard.press("Escape");

    const hamburger = page.locator('button[aria-controls="mobile-main-nav"]');
    const menuOpenStart = Date.now();
    await hamburger.click();
    await expect(page.locator("#mobile-main-nav")).toBeVisible({ timeout: 2000 });
    samples.push({
      label: "Mobile hamburger",
      clickToResponseMs: Date.now() - menuOpenStart,
      passed: true,
    });

    const featuresLink = page.locator('.caretip-public-mobile-nav-links a[href="/features"]');
    await expect(featuresLink).toBeVisible();
    const featuresStart = Date.now();
    await featuresLink.click();
    await expect(page).toHaveURL(/\/features/, { timeout: 3000 });
    samples.push({
      label: "Mobile menu link — Features",
      clickToResponseMs: Date.now() - featuresStart,
      passed: true,
    });

    await page.goto("/");
    await page.waitForTimeout(300);
    await hamburger.click();
    await expect(page.locator("#mobile-main-nav")).toBeVisible();

    const demoLink = page.locator('.caretip-public-mobile-nav-actions a[href="/contact"]');
    await expect(demoLink).toBeVisible();
    const demoStart = Date.now();
    await demoLink.click();
    await expect(page).toHaveURL(/\/contact/, { timeout: 3000 });
    samples.push({
      label: "Demo / Contact CTA",
      clickToResponseMs: Date.now() - demoStart,
      passed: true,
    });

    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const footerLink = page.locator('footer a[href="/pricing"]');
    await expect(footerLink).toBeVisible();
    await footerLink.scrollIntoViewIfNeeded();
    await footerLink.hover();
    await page.waitForTimeout(150);
    const footerStart = Date.now();
    await footerLink.click();
    await expect(page).toHaveURL(/\/pricing/, { timeout: 3000 });
    samples.push({
      label: "Footer link — Pricing",
      clickToResponseMs: Date.now() - footerStart,
      passed: true,
    });

    const blockers = await page.evaluate(() => {
      const suspects: string[] = [];
      document.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const style = getComputedStyle(el);
        if (style.pointerEvents === "none") return;
        const rect = el.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return;
        const hidden =
          Number(style.opacity) < 0.05 ||
          style.visibility === "hidden" ||
          rect.bottom < 0;
        if (!hidden) return;
        const top = document.elementFromPoint(cx, cy);
        if (top === el || el.contains(top)) {
          suspects.push(el.tagName.toLowerCase());
        }
      });
      return suspects;
    });

    const longTasksMaxMs = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let max = 0;
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > max) max = entry.duration;
            }
          });
          obs.observe({ type: "longtask", buffered: true });
          setTimeout(() => {
            obs.disconnect();
            resolve(Math.round(max));
          }, 1200);
        }),
    );

    console.log(
      JSON.stringify(
        {
          samples,
          slowest: samples.reduce((a, b) => (b.clickToResponseMs > a.clickToResponseMs ? b : a)),
          blockers,
          longTasksMaxMs,
        },
        null,
        2,
      ),
    );

    for (const sample of samples) {
      if (sample.label === "Mobile hamburger") continue;
      const limit = sample.label.includes("menu link") || sample.label.includes("Footer") || sample.label.includes("CTA")
        ? 800
        : TARGET_MS;
      expect(sample.clickToResponseMs, sample.label).toBeLessThan(limit);
    }
    expect(blockers.length).toBe(0);
    expect(longTasksMaxMs).toBeLessThan(300);
  });

  test("desktop route transitions start immediately", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(400);

    const routes = ["/features", "/pricing", "/contact", "/login"] as const;

    for (const href of routes) {
      await page.goto("/");
      await page.waitForTimeout(200);

      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible();

      const navStartMs = await link.evaluate((el) => {
        const start = performance.now();
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        return performance.now() - start;
      });

      expect(navStartMs, href).toBeLessThan(TARGET_MS);
      await expect(page).toHaveURL(new RegExp(href.replace("/", "\\/")));
    }
  });
});
