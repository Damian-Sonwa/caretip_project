import { createDashboardSwrStore, DASHBOARD_SWR_METRICS_TTL_MS } from "../dashboardSwrCache";
import type { AnalyticsTimeframe, BusinessAnalyticsBundle } from "./types";

const bundleStore = createDashboardSwrStore<BusinessAnalyticsBundle>();

function storeKey(timeframe: AnalyticsTimeframe): string {
  return `business-analytics:${timeframe}`;
}

export function getBusinessAnalyticsBundle(
  timeframe: AnalyticsTimeframe,
): BusinessAnalyticsBundle | null {
  return bundleStore.get(storeKey(timeframe), DASHBOARD_SWR_METRICS_TTL_MS);
}

export function setBusinessAnalyticsBundle(
  timeframe: AnalyticsTimeframe,
  bundle: BusinessAnalyticsBundle,
): void {
  bundleStore.set(storeKey(timeframe), bundle);
}

/** Persist stats-only bundle (Overview waterfall) without tips feed. */
export function upsertBusinessAnalyticsStatsBundle(
  timeframe: AnalyticsTimeframe,
  periodStats: BusinessAnalyticsBundle["periodStats"],
  weekStats?: BusinessAnalyticsBundle["weekStats"],
): void {
  const existing = getBusinessAnalyticsBundle(timeframe);
  setBusinessAnalyticsBundle(timeframe, {
    timeframe,
    periodStats,
    weekStats: weekStats ?? existing?.weekStats ?? periodStats,
    recentTips: existing?.recentTips ?? [],
    qrAnalytics: existing?.qrAnalytics,
    tipsFeedFetched: existing?.tipsFeedFetched ?? false,
    qrFetched: existing?.qrFetched ?? false,
    fetchedAt: Date.now(),
  });
}

export function clearBusinessAnalyticsStore(timeframe?: AnalyticsTimeframe): void {
  if (timeframe) {
    bundleStore.delete(storeKey(timeframe));
    return;
  }
  bundleStore.clear();
}

export { DASHBOARD_SWR_METRICS_TTL_MS };
