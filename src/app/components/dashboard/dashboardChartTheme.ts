/** Shared chart presentation tokens for business + employee dashboard shells. */

export const DASHBOARD_CHART_GRID = "rgba(148, 163, 184, 0.28)";
export const DASHBOARD_CHART_AXIS = "#94a3b8";
export const DASHBOARD_CHART_BAR = "#197278";
export const DASHBOARD_CHART_BAR_SOFT = "rgba(25, 114, 120, 0.72)";
export const DASHBOARD_CHART_AREA_STROKE = "hsl(var(--primary))";

export const dashboardChartTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(226, 232, 240, 0.95)",
  borderRadius: "10px",
  color: "#0f172a",
  fontSize: "12px",
  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.12)",
} as const;

export function dashboardChartBarFill(index: number, total: number): string {
  if (total <= 1) return DASHBOARD_CHART_BAR;
  const t = index / Math.max(total - 1, 1);
  const opacity = 0.42 + t * 0.38;
  return `rgba(25, 114, 120, ${opacity.toFixed(2)})`;
}
