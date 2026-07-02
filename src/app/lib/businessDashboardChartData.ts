import type { TFunction } from "i18next";
import { translateChartMonthLabel, translateChartWeekdayLabel } from "@/lib/chartAxisLabels";
import { dashboardChartBarFill } from "@/app/components/dashboard/dashboardChartTheme";
import type { AnalyticsTimeframe } from "@/app/hooks/useBusinessDashboardStats";
import type { BusinessDashboardStats } from "@/app/lib/api";
import { getBusinessAnalyticsBundle } from "@/app/lib/businessAnalytics/businessAnalyticsStore";

export type TipPerformanceChartRow = {
  day: string;
  dayLabel: string;
  amount: number;
};

export type EmployeePerformanceChartRow = {
  name: string;
  tips: number;
  rating: number;
  color: string;
};

/** Prefer stats aligned with the active period toggle (SWR cache during switches). */
export function resolveBusinessDashboardChartStats(
  analyticsTimeframe: AnalyticsTimeframe,
  displayStats: BusinessDashboardStats | null,
  statsTimeframe: AnalyticsTimeframe | null,
): BusinessDashboardStats | null {
  if (displayStats && statsTimeframe === analyticsTimeframe) {
    return displayStats;
  }

  const cached = getBusinessAnalyticsBundle(analyticsTimeframe)?.periodStats;
  if (cached?.dailyTipDistribution !== undefined) {
    return {
      ...(displayStats ?? {}),
      ...cached,
      employees: cached.employees ?? displayStats?.employees,
      employeeGoals: cached.employeeGoals ?? displayStats?.employeeGoals,
      dailyTipDistribution: cached.dailyTipDistribution ?? [],
    } as BusinessDashboardStats;
  }

  return displayStats;
}

function normalizeMonthDistributionRows(
  rows: Array<{ day: string; amount: number }>,
): Array<{ day: string; amount: number }> {
  const todayDom = new Date().getDate();
  const elapsed = rows.filter((row) => {
    const dayNum = Number.parseInt(row.day, 10);
    return !Number.isFinite(dayNum) || dayNum <= todayDom;
  });
  return elapsed.length > 0 ? elapsed : rows;
}

/** Map API daily tip buckets to labeled chart rows for the active period toggle. */
export function buildTipPerformanceChartData(
  rows: Array<{ day: string; amount: number }>,
  timeframe: AnalyticsTimeframe,
  t: TFunction,
): TipPerformanceChartRow[] {
  const scopedRows = timeframe === "month" ? normalizeMonthDistributionRows(rows) : rows;

  return scopedRows.map((row) => ({
    ...row,
    dayLabel:
      timeframe === "week"
        ? translateChartWeekdayLabel(row.day, t)
        : timeframe === "year"
          ? translateChartMonthLabel(row.day, t)
          : row.day,
  }));
}

export function sumTipPerformanceTotal(rows: Array<{ amount: number }>): number {
  return rows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
}

export function hasTipPerformanceChartActivity(
  rows: Array<{ amount: number }>,
  periodTotalTips?: number | null,
): boolean {
  if (sumTipPerformanceTotal(rows) > 0) return true;
  return (periodTotalTips ?? 0) > 0;
}

type DashboardEmployeeRow = {
  name: string;
  tipsTotal: number;
  isActive?: boolean;
  activationStatus?: string;
  emailVerified?: boolean;
};

/** Top earners for the team performance bar chart (dashboard overview). */
export function buildEmployeePerformanceChartRows(
  employees: DashboardEmployeeRow[] | undefined,
  limit = 8,
): EmployeePerformanceChartRow[] {
  const ranked = (employees ?? [])
    .filter(
      (e) =>
        e.isActive === true &&
        e.activationStatus === "active" &&
        e.emailVerified === true &&
        e.tipsTotal > 0,
    )
    .sort((a, b) => b.tipsTotal - a.tipsTotal)
    .slice(0, limit);

  return ranked.map((e, index, arr) => ({
    name: e.name,
    tips: e.tipsTotal,
    rating: 0,
    color: dashboardChartBarFill(index, arr.length),
  }));
}
