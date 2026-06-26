import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "../businessDashboardUi";
import { cn } from "@/lib/utils";
import { formatEur } from "../../../lib/formatEur";
import {
  BUSINESS_CHART_GRID,
  BUSINESS_CHART_BAR_SOFT,
  businessChartTooltipStyle,
} from "../businessDashboardChartTheme";
import {
  buildQrChartSeries,
  buildTrendChartSeries,
  type BusinessIntelligenceInput,
} from "../../../lib/businessIntelligence";

type BusinessIntelligenceChartsProps = {
  data: BusinessIntelligenceInput;
  loading: boolean;
};

function ChartShell({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card className={cn(businessUi.cardStatic, "h-full")}>
      <CardHeader className="border-b border-neutral-100/90 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {empty ? (
          <p className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            {t("business.qrAnalytics.emptyTrend")}
          </p>
        ) : (
          <div className="h-[220px] w-full min-w-0">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

export const BusinessIntelligenceCharts = memo(function BusinessIntelligenceCharts({
  data,
  loading,
}: BusinessIntelligenceChartsProps) {
  const { t } = useTranslation();
  const series = useMemo(() => buildTrendChartSeries(data), [data]);
  const qrSeries = useMemo(() => buildQrChartSeries(data), [data]);

  const hasTipData = data.period.totalTips > 0 && series.tipsOverTime.length > 0;
  const showSkeleton = loading && !hasTipData && !qrSeries.hasScans;

  if (showSkeleton) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(businessUi.cardStatic, "h-[280px] animate-pulse bg-muted/30")} />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.bi.trendsTitle")}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell title={t("business.team.performance.bi.chartTipsOverTime")} empty={!hasTipData}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series.tipsOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={44} style={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number) => [formatEur(v), t("charts.tooltip.tips")]}
                contentStyle={businessChartTooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="tips"
                stroke="#197278"
                fill="rgba(25, 114, 120, 0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title={t("business.team.performance.bi.chartScansOverTime")} empty={!qrSeries.hasScans}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={qrSeries.scansOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={44} style={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={businessChartTooltipStyle} />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#197278"
                fill="rgba(25, 114, 120, 0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title={t("business.team.performance.bi.chartConversion")} empty={!qrSeries.hasConversion}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={qrSeries.conversionTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={44} style={{ fontSize: 10 }} unit="%" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, t("business.team.performance.bi.scanConversion")]}
                contentStyle={businessChartTooltipStyle}
              />
              <Line type="monotone" dataKey="conversion" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title={t("business.team.performance.bi.chartRevenue")} empty={!hasTipData}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} width={44} style={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number) => [formatEur(v), t("business.team.performance.bi.revenueLabel")]}
                contentStyle={businessChartTooltipStyle}
              />
              <Bar dataKey="revenue" fill={BUSINESS_CHART_BAR_SOFT} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </section>
  );
});
