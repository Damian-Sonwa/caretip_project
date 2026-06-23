import { useBusinessAnalytics } from "./useBusinessAnalytics";
import type { AnalyticsTimeframe } from "../lib/businessAnalytics";

/**
 * Analytics + Performance intelligence slice (Sprint 3C).
 * Thin wrapper over unified `useBusinessAnalytics`.
 */
export function useBusinessIntelligenceData(
  enabled: boolean,
  advancedAnalytics = true,
  timeframe: AnalyticsTimeframe = "month",
) {
  return useBusinessAnalytics(enabled, {
    timeframe,
    advancedAnalytics,
    includeIntelligence: true,
  });
}
