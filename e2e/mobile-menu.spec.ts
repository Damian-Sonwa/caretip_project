import { test, expect } from "@playwright/test";
import {
  MOBILE_MENU_GUARD_MS,
  MOBILE_MENU_TOGGLE_DEBOUNCE_MS,
  firstMobileNavLink,
  menuButton,
  mobileNavPanel,
  openMobileMenu,
  expectMenuClosed,
  expectMenuOpen,
  tapBackdrop,
} from "./helpers/mobileMenu";

test.describe("Mobile hamburger menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(menuButton(page)).toBeVisible();
    const pwaDismiss = page.getByRole("button", { name: /dismiss|got it|verstanden/i });
    if (await pwaDismiss.isVisible().catch(() => false)) {
      await pwaDismiss.click();
    }
  });

  test("1 — rapid hamburger taps stay responsive (no stuck open/close)", async ({ page }) => {
    test.setTimeout(90_000);
    const btn = menuButton(page);

    for (let i = 0; i < 6; i++) {
      await btn.click({ delay: 30 });
    }

    await expect(async () => {
      const expanded = await btn.getAttribute("aria-expanded");
      expect(["true", "false"]).toContain(expanded);
    }).toPass();

    if ((await btn.getAttribute("aria-expanded")) === "true") {
      await firstMobileNavLink(page).click();
      await expectMenuClosed(page);
    }

    await page.waitForTimeout(MOBILE_MENU_TOGGLE_DEBOUNCE_MS + 50);
    await openMobileMenu(page);
    await page.waitForTimeout(MOBILE_MENU_GUARD_MS + MOBILE_MENU_TOGGLE_DEBOUNCE_MS + 50);
    await btn.click();
    await expectMenuClosed(page);
  });

  test("2 — open menu and immediately tap a navigation item navigates + closes", async ({
    page,
  }) => {
    await openMobileMenu(page);
    const features = page.locator('.caretip-public-mobile-nav-links a[href="/features"]');
    await features.click();
    await expect(page).toHaveURL(/\/features/);
    await expectMenuClosed(page);
  });

  test("3 — open menu and immediately tap outside is blocked by dismiss guard", async ({
    page,
  }) => {
    const btn = menuButton(page);
    await btn.click();
    await page.evaluate(() => {
      document.querySelector<HTMLElement>(".caretip-mobile-drawer-backdrop--open")?.click();
    });
    await expectMenuOpen(page);
  });

  test("4 — open menu, wait 1s, tap outside closes menu", async ({ page }) => {
    await openMobileMenu(page);
    await page.waitForTimeout(1_000);
    await tapBackdrop(page);
    await expectMenuClosed(page);
  });

  test("5 — open menu during page scroll works normally", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 480));
    await page.waitForTimeout(100);
    await openMobileMenu(page);
    await firstMobileNavLink(page).click();
    await expect(page).toHaveURL(/\/how-it-works/);
    await expectMenuClosed(page);
  });

  test("6 — open menu after navigating between pages", async ({ page }) => {
    await page.goto("/pricing");
    await openMobileMenu(page);
    await expectMenuOpen(page);
    await firstMobileNavLink(page).click();
    await expect(page).toHaveURL(/\/how-it-works/);
    await expectMenuClosed(page);

    await page.goto("/");
    await openMobileMenu(page);
    await page.waitForTimeout(MOBILE_MENU_GUARD_MS + 100);
    await menuButton(page).click();
    await expectMenuClosed(page);
  });

  test("toggle close works after guard and debounce windows", async ({ page }) => {
    await openMobileMenu(page);
    await page.waitForTimeout(MOBILE_MENU_GUARD_MS + MOBILE_MENU_TOGGLE_DEBOUNCE_MS + 50);
    await menuButton(page).click();
    await expectMenuClosed(page);
  });

  test("navigate close bypasses guard (menu never traps user)", async ({ page }) => {
    await openMobileMenu(page);
    await page.waitForTimeout(100);
    await firstMobileNavLink(page).click();
    await expectMenuClosed(page);
  });
});

test.describe("Mobile landing load (P0 performance)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("homepage avoids three.js and loads hero image on mobile viewport", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/assets/") || url.includes("story-hero")) {
        requests.push(url);
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    const threeLoaded = requests.some((u) => /three\.module/i.test(u));
    expect(threeLoaded).toBe(false);

    const heroImg = page.locator(".caretip-hero-media-clip img").first();
    await expect(heroImg).toBeVisible({ timeout: 15_000 });

    const naturalWidth = await page
      .locator(".caretip-hero-media-clip img")
      .first()
      .evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });
});
