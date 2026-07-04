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
  if (cached) {
    return {
      ...(displayStats ?? {}),
      ...cached,
      totalTips: cached.totalTips ?? displayStats?.totalTips,
      tipCount: cached.tipCount ?? displayStats?.tipCount,
      employeeCount: cached.employeeCount ?? displayStats?.employeeCount,
      employees: cached.employees ?? displayStats?.employees,
      employeeGoals: cached.employeeGoals ?? displayStats?.employeeGoals,
      dailyTipDistribution: cached.dailyTipDistribution ?? [],
    } as BusinessDashboardStats;
  }

  // Never paint a different period's analytics under the active toggle.
  return null;
}

function isMonthDayOfMonthLabel(day: string): boolean {
  return /^\d{1,2}$/.test(day.trim());
}

function normalizeMonthDistributionRows(
  rows: Array<{ day: string; amount: number }>,
): Array<{ day: string; amount: number }> {
  const todayDom = new Date().getDate();
  const monthDomRows = rows.filter((row) => isMonthDayOfMonthLabel(row.day));
  if (monthDomRows.length === 0) return rows;
  return monthDomRows.filter((row) => Number.parseInt(row.day, 10) <= todayDom);
}

const YEAR_CHART_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Zero scaffold when KPIs show activity but distribution rows are still loading. */
export function buildFallbackTipPerformanceChartData(
  timeframe: AnalyticsTimeframe,
  t: TFunction,
): TipPerformanceChartRow[] {
  if (timeframe === "week") {
    return WEEKDAY_LABELS.map((day) => ({
      day,
      dayLabel: translateChartWeekdayLabel(day, t),
      amount: 0,
    }));
  }
  if (timeframe === "year") {
    return YEAR_CHART_LABELS.map((day) => ({
      day,
      dayLabel: translateChartMonthLabel(day, t),
      amount: 0,
    }));
  }
  const todayDom = new Date().getDate();
  return Array.from({ length: todayDom }, (_, index) => {
    const day = String(index + 1);
    return { day, dayLabel: day, amount: 0 };
  });
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
