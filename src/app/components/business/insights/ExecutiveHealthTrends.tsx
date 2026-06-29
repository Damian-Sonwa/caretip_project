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
import { BUSINESS_CHART_GRID, getBusinessChartTooltipStyle } from "../businessDashboardChartTheme";

type ExecutiveHealthTrendsProps = {
  participation: Array<{ label: string; participation: number }>;
  loading: boolean;
};

/**
 * Executive health trend — participation only (Sprint 2: no revenue/analytics duplicate charts).
 * Source: daily tip distribution via buildTrendChartSeries (tips table).
 */
export function ExecutiveHealthTrends({ participation, loading }: ExecutiveHealthTrendsProps) {
  const { t } = useTranslation();
  const hasData = participation.some((r) => r.participation > 0);

  if (loading && !hasData) {
    return null;
  }

  return (
    <Card className={businessUi.cardStatic}>
      <CardHeader className="border-b border-neutral-100/90 pb-3">
        <CardTitle className="text-sm font-medium">
          {t("business.team.performance.executive.healthTrendsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasData ? (
          <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            {t("emptyState.chart.description")}
          </p>
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={participation} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
