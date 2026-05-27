/**
 * Business dashboard timeframe fetch coordination.
 * Reduces DB queue pressure under connection_limit=1 by aborting stale work
 * and deferring non-active timeframe hydration.
 */

export type BusinessAnalyticsTimeframe = "week" | "month" | "year";

/** Defer hero (month summary) refresh until the active timeframe pipeline settles. */
export const BUSINESS_HERO_MONTH_DEFER_MS = 2_000;

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
