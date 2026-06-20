import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { formatEur } from "../../lib/formatEur";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DashboardChartSkeleton } from "../../components/dashboard/DashboardAnalyticsLoader";
import { DashboardStableChartSlot } from "../../components/dashboard/DashboardSectionLoading";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { employeeUi } from "../../components/employee/employeeDashboardUi";
import {
  DASHBOARD_CHART_AXIS,
  DASHBOARD_CHART_GRID,
  DASHBOARD_CHART_AREA_STROKE,
  dashboardChartTooltipStyle,
} from "../../components/dashboard/dashboardChartTheme";

export type EmployeeDashboardEarningsChartProps = {
  showChartLoading: boolean;
  chartData: Array<{ time: string; amount: number }>;
  analyticsPeriodRefreshing: boolean;
};

export function EmployeeDashboardEarningsChart({
  showChartLoading,
  chartData,
  analyticsPeriodRefreshing,
}: EmployeeDashboardEarningsChartProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      {...dashboardBlockMotion}
      className={cn(
        "dashboard-swr-swap",
        analyticsPeriodRefreshing && "dashboard-swr-swap--revalidating",
      )}
      transition={{ delay: 0.4 }}
    >
      <Card className={cn(employeeUi.cardStatic, employeeUi.chartCard, "w-full")}>
        <CardHeader className={employeeUi.cardHeader}>
          <CardTitle className={employeeUi.cardTitle}>{t("employee.dashboard.earningsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 overflow-x-auto overflow-y-visible pb-2">
          <DashboardStableChartSlot
            loading={showChartLoading}
            minHeightClass="min-h-[220px] sm:min-h-[260px] lg:min-h-[280px]"
            skeleton={
              <DashboardChartSkeleton variant="trend" minHeightClass="h-full min-h-0" className="h-full" />
            }
          >
            {chartData.length === 0 ? (
              <div className={cn(employeeUi.cardPad, employeeUi.chartEmpty)}>
                <EmployeeEmptyState
                  icon={<TrendingUp className="h-6 w-6" aria-hidden />}
                  title={t("emptyState.chart.title")}
                  description={t("emptyState.chart.description")}
                  className="relative z-[1] !py-10"
                />
              </div>
            ) : (
              <div
                className={cn(
                  employeeUi.chartFrame,
                  "dashboard-hero-metric-value--live flex h-[220px] w-full min-w-0 items-center justify-center sm:h-[260px] lg:h-[280px]",
                )}
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="empColorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 6" stroke={DASHBOARD_CHART_GRID} vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke={DASHBOARD_CHART_AXIS}
                      tickLine={false}
                      axisLine={{ stroke: DASHBOARD_CHART_GRID }}
                      style={{ fontSize: "11px" }}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke={DASHBOARD_CHART_AXIS}
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: "11px" }}
                      tickMargin={8}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.earnings")]}
                      contentStyle={dashboardChartTooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={DASHBOARD_CHART_AREA_STROKE}
                      strokeWidth={2}
                      fill="url(#empColorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardStableChartSlot>
        </CardContent>
      </Card>
    </motion.div>
  );
}
