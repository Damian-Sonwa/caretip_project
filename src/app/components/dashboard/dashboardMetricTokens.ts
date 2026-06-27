import { caretipType } from "@/lib/typography/caretipType";
import type { DashboardMetricStatCardTokens } from "./DashboardMetricStatCard";

/** Shared shell — height/grid handled by `.dashboard-metric-stat-card` CSS. */
export const DASHBOARD_METRIC_STAT_CARD_SHELL =
  "business-metric-stat-card-shell min-h-[7.5rem] rounded-[1.125rem] border border-neutral-200/70 bg-white/95 p-3.5 text-left shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] backdrop-blur-[2px] sm:min-h-[8.5rem] sm:p-5";

export const DASHBOARD_METRIC_STAT_LABEL = `${caretipType.kpiLabel} line-clamp-2 leading-snug`;
export const DASHBOARD_METRIC_STAT_VALUE = caretipType.kpiValue;
export const DASHBOARD_METRIC_STAT_CHANGE =
  "line-clamp-2 text-xs leading-snug text-muted-foreground";

export function createDashboardMetricTokens(opts: {
  scopeClass: string;
  featuredClass?: string;
}): DashboardMetricStatCardTokens {
  return {
    statCard: `${opts.scopeClass} ${DASHBOARD_METRIC_STAT_CARD_SHELL}`,
    statLabel: DASHBOARD_METRIC_STAT_LABEL,
    statValue: DASHBOARD_METRIC_STAT_VALUE,
    statChange: DASHBOARD_METRIC_STAT_CHANGE,
    featuredClass: opts.featuredClass ?? "dashboard-metric-stat-card--featured",
    labelRowClass: "dashboard-metric-stat-card__label-row",
    valueClass: "dashboard-metric-stat-card__value-inner",
    changeClass: "dashboard-metric-stat-card__change-inner",
  };
}

export const businessMetricTokens = createDashboardMetricTokens({
  scopeClass: "business-stat-card",
  featuredClass: "business-stat-card--featured dashboard-metric-stat-card--featured",
});

export const employeeMetricTokens = createDashboardMetricTokens({
  scopeClass: "employee-stat-card",
  featuredClass: "employee-stat-card--featured dashboard-metric-stat-card--featured",
});

export const platformMetricTokens = createDashboardMetricTokens({
  scopeClass: "platform-admin-stat-card",
  featuredClass: "platform-admin-stat-card--featured dashboard-metric-stat-card--featured",
});
