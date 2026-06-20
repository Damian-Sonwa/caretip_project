/** Ignore backdrop / toggle-close briefly after open (iOS/Android ghost-click). */
export const MOBILE_MENU_DISMISS_GUARD_MS = 400;

/** Ignore repeated hamburger toggles (Samsung double-fire / rapid taps). */
export const MOBILE_MENU_TOGGLE_DEBOUNCE_MS = 250;

export function canDismissMobileMenuOverlay(openedAt: number, now = performance.now()): boolean {
  return now - openedAt >= MOBILE_MENU_DISMISS_GUARD_MS;
}

export function canAcceptMobileMenuToggle(lastToggleAt: number, now = performance.now()): boolean {
  return now - lastToggleAt >= MOBILE_MENU_TOGGLE_DEBOUNCE_MS;
}
