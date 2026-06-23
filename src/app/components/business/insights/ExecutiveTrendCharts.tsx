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
import { BUSINESS_CHART_GRID, businessChartTooltipStyle } from "../businessDashboardChartTheme";
import { QrAnalyticsComingSoon } from "./QrAnalyticsComingSoon";

type ExecutiveTrendChartsProps = {
  data: {
    tips: Array<{ label: string; tips: number }>;
    participation: Array<{ label: string; participation: number }>;
  };
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
            {t("emptyState.chart.description")}
          </p>
        ) : (
          <div className="h-[180px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExecutiveTrendCharts({ data, loading }: ExecutiveTrendChartsProps) {
  const { t } = useTranslation();
  const hasTips = data.tips.some((r) => r.tips > 0);

  if (loading && !hasTips) {
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
              contentStyle={businessChartTooltipStyle}
            />
            <Area type="monotone" dataKey="tips" stroke="#197278" fill="rgba(25,114,120,0.12)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </TrendCard>

      <TrendCard title={t("business.team.performance.executive.chartScanTrend")} empty={false}>
        <QrAnalyticsComingSoon compact className="h-full min-h-[180px] border-0 shadow-none" />
      </TrendCard>

      <TrendCard title={t("business.team.performance.executive.chartParticipation")} empty={!hasTips}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.participation} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
            <YAxis tickLine={false} axisLine={false} width={40} style={{ fontSize: 9 }} />
            <Tooltip contentStyle={businessChartTooltipStyle} />
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
