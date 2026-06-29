import { useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "../businessDashboardUi";
import { formatEur } from "../../../lib/formatEur";
import { BUSINESS_CHART_GRID, getBusinessChartTooltipStyle } from "../businessDashboardChartTheme";
import { buildQrChartSeries, type BusinessIntelligenceInput } from "../../../lib/businessIntelligence";

type ExecutiveTrendChartsProps = {
  data: {
    tips: Array<{ label: string; tips: number }>;
    participation: Array<{ label: string; participation: number }>;
  };
  qrInput?: Pick<BusinessIntelligenceInput, "qrAnalytics" | "dailyTipDistribution" | "period"> | null;
  loading: boolean;
};

function TrendCard({
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
    <Card className={businessUi.cardStatic}>
      <CardHeader className="border-b border-neutral-100/90 pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {empty ? (
          <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            {t("business.qrAnalytics.emptyTrend")}
          </p>
        ) : (
          <div className="h-[180px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExecutiveTrendCharts({ data, qrInput, loading }: ExecutiveTrendChartsProps) {
  const { t } = useTranslation();
  const hasTips = data.tips.some((r) => r.tips > 0);
  const qrSeries = useMemo(
    () =>
      qrInput
        ? buildQrChartSeries({
            period: qrInput.period,
            week: qrInput.period,
            today: qrInput.period,
            dailyTipDistribution: qrInput.dailyTipDistribution,
            recentTips: [],
            employees: [],
            employeeGoals: [],
            pulse: null,
            qrAnalytics: qrInput.qrAnalytics,
          })
        : { scansOverTime: [], hasScans: false },
    [qrInput],
  );

  if (loading && !hasTips && !qrSeries.hasScans) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TrendCard title={t("business.team.performance.executive.chartTipGrowth")} empty={!hasTips}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.tips} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
            <YAxis tickLine={false} axisLine={false} width={40} style={{ fontSize: 9 }} />
            <Tooltip
              formatter={(v: number) => [formatEur(v), t("charts.tooltip.tips")]}
              contentStyle={getBusinessChartTooltipStyle()}
            />
            <Area type="monotone" dataKey="tips" stroke="#197278" fill="rgba(25,114,120,0.12)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </TrendCard>

      <TrendCard title={t("business.team.performance.executive.chartScanTrend")} empty={!qrSeries.hasScans}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={qrSeries.scansOverTime} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
            <YAxis tickLine={false} axisLine={false} width={40} style={{ fontSize: 9 }} allowDecimals={false} />
            <Tooltip contentStyle={getBusinessChartTooltipStyle()} />
            <Area type="monotone" dataKey="scans" stroke="#197278" fill="rgba(25,114,120,0.12)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </TrendCard>

      <TrendCard title={t("business.team.performance.executive.chartParticipation")} empty={!hasTips}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.participation} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
            <YAxis tickLine={false} axisLine={false} width={40} style={{ fontSize: 9 }} />
            <Tooltip contentStyle={getBusinessChartTooltipStyle()} />
            <Area
              type="monotone"
              dataKey="participation"
              stroke="#a78bfa"
              fill="rgba(167,139,250,0.12)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </TrendCard>
    </div>
  );
}
