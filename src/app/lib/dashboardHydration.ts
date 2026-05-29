/**
 * Coordinated dashboard hydration — grouped data phases without rewriting fetch logic.
 *
 * HERO: account balances / operational pulse (single snapshot, no staggered values)
 * METRICS: period KPI cards (summary scope — commit together)
 * ANALYTICS: charts, distributions (analytics scope)
 * GOALS: goal progress / staff goals (analytics or summary goal fields)
 */

export type DashboardHydrationGroup = "hero" | "metrics" | "analytics" | "goals";

/**
 * Fresh-first: never paint in-memory SWR on first paint or period change.
 * Background sync only after the UI has shown a successful live response once.
 */
export function canUseDashboardSwrCache(opts: {
  hasSettledLiveUi: boolean;
  soft?: boolean;
}): boolean {
  return Boolean(opts.hasSettledLiveUi && opts.soft);
}

/** After first live paint, allow session SWR + partial maps on period switches (not cold load). */
export function canUsePeriodSwitchCache(hasSettledLiveUi: boolean): boolean {
  return hasSettledLiveUi;
}

export function markDashboardLiveSettled(ref: { current: boolean }): void {
  ref.current = true;
}
