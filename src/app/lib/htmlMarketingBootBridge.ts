/**
 * HTML first-paint bridge for cold loads (see index.html).
 * Visually matches AppBrandedLoadingScreen; React overlay becomes source of truth after mount.
 */

const BOOT_ID = "caretip-html-boot";
const ACTIVE_CLASS = "caretip-html-boot-active";

export function dismissHtmlMarketingBootBridge(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(ACTIVE_CLASS);
  document.getElementById(BOOT_ID)?.remove();
}
