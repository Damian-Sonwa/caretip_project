import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, MapPin, Table2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "../businessDashboardUi";
import { formatEur } from "../../../lib/formatEur";
import {
  computeBusinessInsights,
  type BusinessIntelligenceInput,
} from "../../../lib/businessIntelligence";

type BusinessInsightsPanelProps = {
  data: BusinessIntelligenceInput;
};

export function BusinessInsightsPanel({ data }: BusinessInsightsPanelProps) {
  const { t } = useTranslation();
  const insights = useMemo(() => computeBusinessInsights(data), [data]);

  const items = [
    {
      icon: Calendar,
      label: t("business.team.performance.bi.bestDay"),
      value: insights.bestDay,
      hint: insights.bestDayAmount > 0 ? formatEur(insights.bestDayAmount) : "—",
    },
    {
      icon: Clock,
      label: t("business.team.performance.bi.bestShift"),
      value: t(`business.team.performance.bi.shifts.${insights.bestShift}`, {
        defaultValue: insights.bestShift,
      }),
      hint: null,
    },
    {
      icon: MapPin,
      label: t("business.team.performance.bi.bestLocation"),
      value: insights.bestLocation,
      hint: null,
    },
    {
      icon: Table2,
      label: t("business.team.performance.bi.bestTable"),
      value: insights.bestTable,
      hint: null,
    },
    {
      icon: TrendingUp,
      label: t("business.team.performance.bi.peakPeriod"),
      value: insights.peakPeriod,
      hint: null,
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.bi.insightsTitle")}
      </h2>
      <Card className={businessUi.cardStatic}>
        <CardHeader className="border-b border-neutral-100/90 pb-3">
          <CardTitle className="text-base">{t("business.team.performance.bi.insightsCardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, label, value, hint }) => (
            <div
              key={label}
              className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3"
            >
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="truncate text-sm font-semibold text-foreground">{value}</p>
              {hint ? <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{hint}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
