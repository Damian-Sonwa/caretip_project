import { expect, type Page } from "@playwright/test";

export const MOBILE_MENU_GUARD_MS = 400;
export const MOBILE_MENU_TOGGLE_DEBOUNCE_MS = 250;

export function menuButton(page: Page) {
  return page.locator('button[aria-controls="mobile-main-nav"]');
}

export function mobileNavPanel(page: Page) {
  return page.locator("#mobile-main-nav");
}

export function mobileNavBackdrop(page: Page) {
  return page.locator(".caretip-mobile-drawer-backdrop--open");
}

export function firstMobileNavLink(page: Page) {
  return page.locator(".caretip-public-mobile-nav-links a").first();
}

export async function openMobileMenu(page: Page) {
  const btn = menuButton(page);
  await expect(btn).toBeVisible();
  if ((await btn.getAttribute("aria-expanded")) === "true") return;
  await btn.click();
  await expect(mobileNavPanel(page)).toBeVisible();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
}

export async function expectMenuClosed(page: Page) {
  await expect(mobileNavPanel(page)).toBeHidden();
  await expect(menuButton(page)).toHaveAttribute("aria-expanded", "false");
}

export async function expectMenuOpen(page: Page) {
  await expect(mobileNavPanel(page)).toBeVisible();
  await expect(menuButton(page)).toHaveAttribute("aria-expanded", "true");
}

export async function tapBackdrop(page: Page) {
  await mobileNavBackdrop(page).click({ position: { x: 8, y: 8 } });
}
