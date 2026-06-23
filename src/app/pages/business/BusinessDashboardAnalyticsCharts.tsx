import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Users, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CareIcon } from "@/components/icons";
import { dashboardBlockMotion } from "@/lib/motionPerf";
import { formatEur } from "../../lib/formatEur";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DashboardChartSkeleton } from "../../components/dashboard/DashboardAnalyticsLoader";
import {
  DashboardStableChartSlot,
  DeferredContentFade,
} from "../../components/dashboard/DashboardSectionLoading";
import { EmployeeEmptyState } from "../../components/employee/EmployeeEmptyState";
import { businessUi } from "../../components/business/businessDashboardUi";
import {
  BUSINESS_CHART_AXIS,
  BUSINESS_CHART_BAR_SOFT,
  BUSINESS_CHART_GRID,
  businessChartBarFill,
  businessChartTooltipStyle,
} from "../../components/business/businessDashboardChartTheme";

export type BusinessDashboardAnalyticsChartsProps = {
  showChartsLoading: boolean;
  useDevDemo: boolean;
  hasTipActivityInPeriod: boolean;
  tipDistributionChartData: Array<{ day: string; dayLabel: string; amount: number }>;
  tipDistributionTotal: number;
  employeePerformance: Array<{ name: string; tips: number; rating: number; color: string }>;
  employeeCount: number;
  /** Overview shows revenue trend only; full mode includes employee leaderboard chart. */
  chartMode?: "full" | "revenueOnly";
};

export function BusinessDashboardAnalyticsCharts({
  showChartsLoading,
  useDevDemo,
  hasTipActivityInPeriod,
  tipDistributionChartData,
  tipDistributionTotal,
  employeePerformance,
  employeeCount,
  chartMode = "full",
}: BusinessDashboardAnalyticsChartsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn(businessUi.analyticsChartsGrid, chartMode === "revenueOnly" && "grid-cols-1")}>
      <motion.div
        {...dashboardBlockMotion}
        transition={{ delay: 0.4 }}
        className="flex h-full min-h-0 w-full"
      >
        <Card className={cn(businessUi.cardStatic, "business-dashboard-chart-card business-dashboard-panel-card w-full")}>
          <CardHeader className="business-dashboard-panel-card__header">
            <CardTitle className="text-lg leading-snug">{t("business.dashboard.dailyTipDistTitle")}</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              "business-dashboard-panel-card__content min-w-0 flex-1 overflow-x-auto overflow-y-visible transition-opacity duration-300",
            )}
          >
            <DashboardStableChartSlot
              loading={showChartsLoading && !useDevDemo}
              minHeightClass="min-h-[260px] sm:min-h-[290px]"
              skeleton={<DashboardChartSkeleton minHeightClass="h-full min-h-0" className="h-full" />}
            >
              {!hasTipActivityInPeriod || tipDistributionChartData.length === 0 ? (
                <div className={cn(businessUi.cardPad, "business-dashboard-chart-empty")}>
                  <EmployeeEmptyState
                    className="relative z-[1] py-10 sm:py-12"
                    icon={<CareIcon name="analytics" size="lg" className="text-muted-foreground" />}
                    title={t("emptyState.chart.title")}
                    description={t("emptyState.chart.description")}
                  />
                </div>
              ) : (
                <DeferredContentFade show={!showChartsLoading || useDevDemo}>
                  <div className="business-dashboard-chart-frame flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={tipDistributionChartData}
                        margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                        barCategoryGap="18%"
                      >
                        <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
                        <XAxis
                          dataKey="dayLabel"
                          stroke={BUSINESS_CHART_AXIS}
                          tickLine={false}
                          axisLine={{ stroke: BUSINESS_CHART_GRID }}
                          style={{ fontSize: "11px" }}
                          tickMargin={8}
                        />
                        <YAxis
                          stroke={BUSINESS_CHART_AXIS}
                          tickLine={false}
                          axisLine={false}
                          style={{ fontSize: "11px" }}
                          tickMargin={8}
                          width={48}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.tips")]}
                          contentStyle={businessChartTooltipStyle}
                          cursor={{ fill: "rgba(25, 114, 120, 0.06)" }}
                        />
                        <Bar
                          dataKey="amount"
                          fill={BUSINESS_CHART_BAR_SOFT}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={44}
                          minPointSize={3}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="business-dashboard-chart-insight">
                    {t("business.dashboard.chartDistributionTotal", {
                      total: formatEur(tipDistributionTotal),
                    })}
                  </p>
                </DeferredContentFade>
              )}
            </DashboardStableChartSlot>
          </CardContent>
        </Card>
      </motion.div>

      {chartMode === "full" ? (
      <motion.div
        {...dashboardBlockMotion}
        transition={{ delay: 0.5 }}
        className="flex h-full min-h-0 w-full"
      >
        <Card className={cn(businessUi.cardStatic, "business-dashboard-chart-card business-dashboard-panel-card w-full")}>
          <CardHeader className="business-dashboard-panel-card__header">
            <CardTitle className="text-lg leading-snug">{t("business.dashboard.employeePerformanceTitle")}</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              "business-dashboard-panel-card__content min-w-0 flex-1 overflow-x-auto overflow-y-visible transition-opacity duration-300",
            )}
          >
            <DashboardStableChartSlot
              loading={showChartsLoading && !useDevDemo}
              minHeightClass="min-h-[260px] sm:min-h-[290px]"
              skeleton={<DashboardChartSkeleton minHeightClass="h-full min-h-0" className="h-full" />}
            >
              {employeeCount === 0 ? (
                <div className={cn(businessUi.cardPad)}>
                  <EmployeeEmptyState
                    className="py-10 sm:py-12"
                    icon={<Users className="h-6 w-6 text-muted-foreground" aria-hidden />}
                    title={t("business.dashboard.noEmployees")}
                    description={t("business.dashboard.noEmployeesChartHint")}
                  />
                </div>
              ) : !hasTipActivityInPeriod ? (
                <div className={cn(businessUi.cardPad)}>
                  <EmployeeEmptyState
                    className="py-10 sm:py-12"
                    icon={<TrendingUp className="h-6 w-6 text-muted-foreground" aria-hidden />}
                    title={t("emptyState.chart.title")}
                    description={t("emptyState.chart.description")}
                  />
                </div>
              ) : employeePerformance.length === 0 ? (
                <div className={cn(businessUi.cardPad)}>
                  <EmployeeEmptyState
                    className="py-10 sm:py-12"
                    icon={<TrendingUp className="h-6 w-6 text-muted-foreground" aria-hidden />}
                    title={t("emptyState.chart.title")}
                    description={t("emptyState.chart.description")}
                  />
                </div>
              ) : (
                <DeferredContentFade show={!showChartsLoading || useDevDemo}>
                  <div className="business-dashboard-chart-frame flex h-[260px] w-full min-w-0 items-center justify-center sm:h-[290px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={employeePerformance}
                        layout="vertical"
                        margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
                        barCategoryGap="16%"
                      >
                        <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} horizontal={false} />
                        <XAxis
                          type="number"
                          stroke={BUSINESS_CHART_AXIS}
                          tickLine={false}
                          axisLine={{ stroke: BUSINESS_CHART_GRID }}
                          style={{ fontSize: "11px" }}
                          tickMargin={8}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke={BUSINESS_CHART_AXIS}
                          tickLine={false}
                          axisLine={false}
                          style={{ fontSize: "11px" }}
                          width={100}
                          tickMargin={6}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatEur(Number(value)), t("charts.tooltip.tips")]}
                          contentStyle={businessChartTooltipStyle}
                          cursor={{ fill: "rgba(25, 114, 120, 0.05)" }}
                        />
                        <Bar dataKey="tips" radius={[0, 6, 6, 0]} maxBarSize={22} minPointSize={4}>
                          {employeePerformance.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={businessChartBarFill(index, employeePerformance.length)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="business-dashboard-chart-insight">
                    {t("business.dashboard.chartPerformanceLeader", {
                      name: employeePerformance[0]?.name ?? "—",
                      amount: formatEur(employeePerformance[0]?.tips ?? 0),
                    })}
                  </p>
                </DeferredContentFade>
              )}
            </DashboardStableChartSlot>
          </CardContent>
        </Card>
      </motion.div>
      ) : null}
    </div>
  );
}
