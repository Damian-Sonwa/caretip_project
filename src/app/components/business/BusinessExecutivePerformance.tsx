import { lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumSummaryCard } from "../premium/PremiumSummaryCard";
import { CountUpMetric } from "../dashboard/CountUpMetric";
import { businessUi } from "./businessDashboardUi";
import { cn } from "@/lib/utils";
import type { useBusinessIntelligenceData } from "../../hooks/useBusinessIntelligenceData";
import type { ExecutiveOpportunity, ExecutiveInsight, ExecutiveSummary } from "../../lib/businessIntelligence";

const ExecutiveHealthTrends = lazy(() =>
  import("./insights/ExecutiveHealthTrends").then((mod) => ({
    default: mod.ExecutiveHealthTrends,
  })),
);

type BiData = ReturnType<typeof useBusinessIntelligenceData>;

function IntelligenceItem({
  item,
  icon: Icon,
  borderClass,
  iconClass,
}: {
  item: ExecutiveOpportunity;
  icon: typeof AlertTriangle;
  borderClass: string;
  iconClass: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3.5", borderClass)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-foreground">{t(item.messageKey, item.params)}</p>
        <p className="text-xs text-muted-foreground">
          {t(item.evidenceKey, item.evidenceParams)}
        </p>
      </div>
    </div>
  );
}

function ExecutiveSummaryCard({ data }: { data: BiData }) {
  const { t } = useTranslation();
  const summary = data.bi.executiveSummary;
  const text = summary.clauses
    .map((c: ExecutiveSummary["clauses"][number]) => String(t(c.key, c.params)))
    .join(" ");

  return (
    <Card className={businessUi.cardStatic}>
      <CardContent className="space-y-2 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("business.team.performance.executive.summaryTitle")}
        </h2>
        <p className="text-base leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function BusinessHealthCard({ data }: { data: BiData }) {
  const { t } = useTranslation();
  const { score, grade } = data.bi.health;
  const growth = data.bi.snapshot.growthRate;

  return (
    <PremiumSummaryCard
      variant="health"
      title={t("business.team.performance.executive.healthTitle")}
      eyebrow={<span className="premium-badge">{t(`business.team.performance.executive.healthGrades.${grade}`)}</span>}
      metrics={[
        {
          label: t("business.team.performance.executive.snapshot.health"),
          value: (
            <>
              <CountUpMetric value={score} kind="integer" />
              <span className="text-lg font-medium text-white/70"> / 100</span>
            </>
          ),
          trend: t(`business.team.performance.executive.healthGrades.${grade}`),
          trendDirection:
            grade === "excellent" || grade === "good"
              ? "up"
              : grade === "needs_attention"
                ? "down"
                : "neutral",
        },
        {
          label: t("business.team.performance.executive.snapshot.growth"),
          value: <CountUpMetric value={growth} kind="percent" />,
          trend: t("premium.summaryBanner.growthValue", { percent: growth }),
          trendDirection: growth >= 0 ? "up" : "down",
        },
        {
          label: t("premium.health.status"),
          value: t(`business.team.performance.executive.healthGrades.${grade}`),
        },
      ]}
      footer={
        <p className="text-sm text-white/80">
          {t("business.team.performance.executive.healthExplain")}
        </p>
      }
    />
  );
}

function InsightList({ insights }: { insights: BiData["bi"]["executiveInsights"] }) {
  const { t } = useTranslation();
  if (insights.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.executive.insightsTitle")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((item: ExecutiveInsight) => (
          <Card key={item.id} className={businessUi.cardStatic}>
            <CardContent className="flex gap-3 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground">
                {String(t(item.messageKey, item.params))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function OpportunityList({ items }: { items: ExecutiveOpportunity[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.executive.opportunitiesTitle")}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <IntelligenceItem
            key={item.id}
            item={item}
            icon={Lightbulb}
            borderClass={
              item.tone === "success"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : item.tone === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border/70 bg-muted/20"
            }
            iconClass="text-primary"
          />
        ))}
      </div>
    </section>
  );
}

type BusinessExecutivePerformanceProps = {
  data: BiData;
};

function RiskList({ items }: { items: ExecutiveOpportunity[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.executive.risksTitle")}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <IntelligenceItem
            key={item.id}
            item={item}
            icon={AlertTriangle}
            borderClass="border-amber-500/30 bg-amber-500/5"
            iconClass="text-amber-700"
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationList({ items }: { items: ExecutiveOpportunity[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.executive.recommendationsTitle")}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <IntelligenceItem
            key={item.id}
            item={item}
            icon={Lightbulb}
            borderClass="border-primary/20 bg-primary/5"
            iconClass="text-primary"
          />
        ))}
      </div>
    </section>
  );
}

/** Sprint 6G — Performance owns intelligence; reporting stays in Analytics. */
export function BusinessExecutivePerformance({ data }: BusinessExecutivePerformanceProps) {
  const { t } = useTranslation();
  const participationTrend = useMemo(
    () => data.bi.trends.participationTrend,
    [data.bi.trends.participationTrend],
  );

  return (
    <div className="space-y-8">
      <ExecutiveSummaryCard data={data} />
      <BusinessHealthCard data={data} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("business.team.performance.executive.healthTrendsTitle")}
        </h2>
        <Suspense
          fallback={
            <div className={cn(businessUi.cardStatic, "h-[220px] animate-pulse bg-muted/30")} />
          }
        >
          <ExecutiveHealthTrends participation={participationTrend} loading={data.loading} />
        </Suspense>
      </section>

      <RiskList items={data.bi.risks} />
      <OpportunityList items={data.bi.opportunities} />
      <RecommendationList items={data.bi.recommendations} />
      <InsightList insights={data.bi.executiveInsights} />
    </div>
  );
}
