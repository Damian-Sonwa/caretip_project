import type { BusinessDashboardStats } from "./api";

type EmployeeVisiblePayload = {
  periodAmountEur?: number;
  periodTipCount?: number;
  totalEarningsEur?: number;
  ratingCount?: number;
  chartSeries?: unknown[];
  tips?: unknown[];
  monthlyGoal?: number | null;
};

type EmployeeMetricSlice = {
  periodTipCount?: number;
  periodAmountEur?: number;
  totalEarningsEur?: number;
  ratingCount?: number;
};

/** Summary scope returned aggregate fields (including legitimate zeros). */
export function hasEmployeeMetricValues(
  data: EmployeeMetricSlice | null | undefined,
): boolean {
  return isEmployeeSummaryFetched(data);
}

/** Network summary response includes period aggregates (0 is a valid value). */
export function isEmployeeSummaryFetched(
  data: EmployeeMetricSlice | null | undefined,
): boolean {
  if (!data) return false;
  return (
    typeof data.periodTipCount === "number" || typeof data.periodAmountEur === "number"
  );
}

/** Period has tips, earnings, or ratings — not merely a settled empty response. */
export function hasEmployeePeriodActivity(
  data: EmployeeMetricSlice | null | undefined,
): boolean {
  if (!data) return false;
  return (
    (data.periodTipCount ?? 0) > 0 ||
    (data.periodAmountEur ?? 0) > 0 ||
    (typeof data.ratingCount === "number" && data.ratingCount > 0)
  );
}

/** KPI fields on business dashboard stats. */
export function hasBusinessKpiValues(data: BusinessDashboardStats | null | undefined): boolean {
  return isBusinessSummaryFetched(data);
}

/** Business summary scope returned (including legitimate zeros). */
export function isBusinessSummaryFetched(
  data: BusinessDashboardStats | null | undefined,
): boolean {
  if (!data) return false;
  return data.totalTips != null || data.tipCount != null || data.employeeCount != null;
}

/** Selected period has tip volume. */
export function hasBusinessPeriodActivity(
  data: BusinessDashboardStats | null | undefined,
): boolean {
  if (!data) return false;
  return (data.tipCount ?? 0) > 0 || (data.totalTips ?? 0) > 0;
}

/** Charts, goals, top performers, or roster — any non-metric section content. */
export function hasBusinessSecondaryContent(
  data: BusinessDashboardStats | null | undefined,
): boolean {
  if (!data) return false;
  return (
    Boolean(data.dailyTipDistribution?.length) ||
    Boolean(data.employeeGoals?.length) ||
    (data.employees?.length ?? 0) > 0
  );
}

/** Analytics scope has returned (empty arrays still count as settled). */
export function hasBusinessAnalyticsPayload(
  data: Partial<BusinessDashboardStats> | null | undefined,
): boolean {
  if (!data) return false;
  return data.dailyTipDistribution !== undefined || data.employeeGoals !== undefined;
}

/** Employee goals slice fetched — distinct from "has goals rows". */
export function isBusinessGoalsPayloadSettled(
  data: BusinessDashboardStats | null | undefined,
): boolean {
  return data?.employeeGoals !== undefined;
}

/** Any content suitable to keep on screen during refresh/revalidation. */
export function hasBusinessDashboardVisibleContent(
  data: BusinessDashboardStats | null | undefined,
): boolean {
  return hasBusinessKpiValues(data) || hasBusinessSecondaryContent(data);
}

export function hasEmployeePayloadVisibleContent(
  payload: EmployeeVisiblePayload | null | undefined,
): boolean {
  if (!payload) return false;
  if (isEmployeeSummaryFetched(payload)) return true;
  return (
    typeof payload.totalEarningsEur === "number" ||
    Boolean(payload.chartSeries?.length) ||
    Boolean(payload.tips?.length) ||
    payload.monthlyGoal != null
  );
}

export function hasEmployeeChartOrTipsContent(
  payload: EmployeeVisiblePayload | null | undefined,
): boolean {
  if (!payload) return false;
  return Boolean(payload.chartSeries?.length) || Boolean(payload.tips?.length);
}

/** Analytics scope has returned (empty chart arrays still count as settled). */
export function hasEmployeeAnalyticsPayload(
  payload: EmployeeVisiblePayload | null | undefined,
): boolean {
  if (!payload) return false;
  return payload.chartSeries !== undefined;
}
