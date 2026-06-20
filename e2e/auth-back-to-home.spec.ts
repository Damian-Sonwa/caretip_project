import { test, expect } from "@playwright/test";

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/join",
  "/forgot-password",
  "/verify-email",
  "/activate",
  "/platform-admin/login",
] as const;

test.describe("Auth back to home navigation", () => {
  for (const path of AUTH_ROUTES) {
    test(`${path} shows back to home nav`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const nav = page.locator(".caretip-auth-back-home");
      await expect(nav).toBeVisible();
      await expect(nav.locator('a[href="/"]').first()).toBeVisible();
      await expect(nav.getByRole("link", { name: /back to home|zur startseite/i })).toHaveCount(2);
    });
  }

  test("mobile layout keeps nav on marketing side above auth card", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const nav = page.locator(".caretip-auth-marketing .caretip-auth-back-home");
    const card = page.locator(".caretip-auth-card").first();
    await expect(nav).toBeVisible();
    await expect(card).toBeVisible();
    const navBox = await nav.boundingBox();
    const cardBox = await card.boundingBox();
    expect(navBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(navBox!.y).toBeLessThan(cardBox!.y);
    await expect(page.locator(".caretip-auth-split-layout__panel-inner .caretip-auth-back-home")).toHaveCount(0);
  });

  test("back to home links navigate to landing", async ({ page }) => {
    await page.goto("/login");
    await page.locator(".caretip-auth-back-home__link").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
