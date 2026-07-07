import { useBusinessAnalytics } from "./useBusinessAnalytics";
import type { AnalyticsTimeframe } from "../lib/businessAnalytics";

/**
 * @deprecated Prefer `useBusinessAnalytics` — retained for Live Tips and Top Performers activity slices.
 */
export type TipsPeriodSnapshot = import("../lib/businessAnalytics").AnalyticsPeriodSnapshot;

export type BusinessTipsModuleData = ReturnType<typeof useBusinessTipsModuleData>;

/**
 * Activity-focused slice of unified analytics (Sprint 3C).
 * Rankings and live feed — does not duplicate BI aggregation when intelligence omitted.
 */
export function useBusinessTipsModuleData(
  enabled: boolean,
  advancedAnalytics = true,
  timeframe: AnalyticsTimeframe = "month",
) {
  const data = useBusinessAnalytics(enabled, {
    timeframe,
    advancedAnalytics,
    includeIntelligence: false,
  });

  return {
    loading: data.loading,
    timeframe: data.timeframe,
    timeframeLoading: data.timeframeLoading,
    hasVisibleAnalyticsData: data.hasVisibleAnalyticsData,
    isInitialAnalyticsLoading: data.isInitialAnalyticsLoading,
    isAnalyticsRefreshing: data.isAnalyticsRefreshing,
    pulse: data.pulse,
    today: data.today,
    week: data.week,
    period: data.period,
    recentTips: data.recentTips,
    employees: data.employees,
    employeeGoals: data.employeeGoals,
    dailyTipDistribution: data.dailyTipDistribution,
    refresh: data.refresh,
  };
}
