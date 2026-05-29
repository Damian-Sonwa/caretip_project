/**
 * Business dashboard timeframe fetch coordination.
 * Reduces DB queue pressure under connection_limit=1 by aborting stale work
 * and deferring non-active timeframe hydration.
 */

export type BusinessAnalyticsTimeframe = "week" | "month" | "year";

/** Defer hero (month summary) refresh until the active timeframe pipeline settles. */
export const BUSINESS_HERO_MONTH_DEFER_MS = 4_000;

/** Wait after active period settles before hydrating inactive timeframes (post-first-paint). */
export const DASHBOARD_INACTIVE_PREFETCH_DELAY_MS = 900;

export function abortTimeframeControllers(
  controllers: Map<BusinessAnalyticsTimeframe, AbortController>,
  keep?: BusinessAnalyticsTimeframe,
): void {
  for (const [tf, controller] of controllers) {
    if (keep && tf === keep) continue;
    controller.abort();
    controllers.delete(tf);
  }
}
