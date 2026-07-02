import { memo, useMemo } from "react";

import { useTranslation } from "react-i18next";

import {

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

import {

  BUSINESS_CHART_GRID,

  getBusinessChartTooltipStyle,

} from "../businessDashboardChartTheme";

import { LIGHTWEIGHT_LINE } from "../../../lib/lightweightChartProps";

import { buildQrChartSeries, type BusinessIntelligenceInput } from "../../../lib/businessIntelligence";



type BusinessIntelligenceChartsProps = {

  data: BusinessIntelligenceInput;

  loading: boolean;

};



/**

 * Advanced analytics — QR scan-to-tip conversion only.

 * Tips trend: dashboard overview. Participation: team performance page.

 */

export const BusinessIntelligenceCharts = memo(function BusinessIntelligenceCharts({

  data,

  loading,

}: BusinessIntelligenceChartsProps) {

  const { t } = useTranslation();

  const qrSeries = useMemo(() => buildQrChartSeries(data), [data]);



  const showSkeleton = loading && !qrSeries.hasConversion;



  if (showSkeleton) {

    return (

      <div

        className={cn(businessUi.cardStatic, "business-dashboard-chart-card h-[280px] animate-pulse bg-muted/30")}

      />

    );

  }



  return (

    <Card className={cn(businessUi.cardStatic, "business-dashboard-chart-card w-full")}>

      <CardHeader className="business-dashboard-panel-card__header border-b border-neutral-100/90 pb-3 dark:border-border/60">

        <CardTitle className="text-base">{t("business.team.performance.bi.chartConversion")}</CardTitle>

      </CardHeader>

      <CardContent className="business-dashboard-panel-card__content pt-4">

        {!qrSeries.hasConversion ? (

          <p className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">

            {t("business.qrAnalytics.emptyTrend")}

          </p>

        ) : (

          <div className="business-dashboard-chart-frame h-[220px] w-full min-w-0 sm:h-[240px]">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={qrSeries.conversionTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>

                <CartesianGrid strokeDasharray="4 6" stroke={BUSINESS_CHART_GRID} vertical={false} />

                <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 10 }} />

                <YAxis tickLine={false} axisLine={false} width={44} style={{ fontSize: 10 }} unit="%" />

                <Tooltip

                  formatter={(v: number) => [`${v}%`, t("business.team.performance.bi.scanConversion")]}

                  contentStyle={getBusinessChartTooltipStyle()}

                />

                <Line

                  dataKey="conversion"

                  stroke="#a78bfa"

                  strokeWidth={2}

                  {...LIGHTWEIGHT_LINE}

                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        )}

      </CardContent>

    </Card>

  );

});


