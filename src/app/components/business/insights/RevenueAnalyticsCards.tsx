import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Percent, TrendingUp, Wallet } from "lucide-react";
import { BusinessStatCard } from "../BusinessStatCard";
import { CountUpMetric } from "../../dashboard/CountUpMetric";
import { businessUi } from "../businessDashboardUi";
import { cn } from "@/lib/utils";
import {
  computeRevenueAnalytics,
  type BusinessIntelligenceInput,
} from "../../../lib/businessIntelligence";
import { formatEur } from "../../../lib/formatEur";

type RevenueAnalyticsCardsProps = {
  data: BusinessIntelligenceInput;
  loading: boolean;
  refreshing?: boolean;
  refreshingLabel?: string;
  showHeading?: boolean;
};

export function RevenueAnalyticsCards({
  data,
  loading,
  refreshing = false,
  refreshingLabel,
  showHeading = true,
}: RevenueAnalyticsCardsProps) {
  const { t } = useTranslation();
  const revenue = useMemo(() => computeRevenueAnalytics(data), [data]);

  return (
    <section className="space-y-3">
      {showHeading ? (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("business.team.performance.bi.revenueTitle")}
        </h2>
      ) : null}
      <div className={cn(businessUi.statsGrid, "lg:grid-cols-4")}>
        <BusinessStatCard
          featured
          loading={loading}
          refreshing={refreshing}
          refreshingLabel={refreshingLabel}
          loadingVariant="currency"
          label={t("business.team.performance.bi.totalTips")}
          value={<CountUpMetric value={revenue.totalTips} kind="eur" />}
          change={t("business.team.performance.bi.tipCountHint", { count: revenue.tipCount })}
          icon={<Coins className="h-5 w-5" aria-hidden />}
        />
        <BusinessStatCard
          loading={loading}
          refreshing={refreshing}
          refreshingLabel={refreshingLabel}
          label={t("business.team.performance.bi.tipGrowth")}
          value={<CountUpMetric value={revenue.growthPercent} kind="percent" />}
          change={t("business.team.performance.bi.tipGrowthHint")}
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
        />
        <BusinessStatCard
          loading={loading}
          refreshing={refreshing}
          refreshingLabel={refreshingLabel}
          label={t("business.team.performance.bi.avgTip")}
          value={<CountUpMetric value={revenue.averageTip} kind="eur" />}
          icon={<Wallet className="h-5 w-5" aria-hidden />}
        />
        <BusinessStatCard
          loading={loading}
          refreshing={refreshing}
          refreshingLabel={refreshingLabel}
          label={t("business.team.performance.bi.weeklyRevenue")}
          value={<CountUpMetric value={revenue.weeklyRevenue} kind="eur" />}
          change={t("business.team.performance.bi.periodRevenueHint", {
            amount: formatEur(revenue.periodRevenue),
          })}
          icon={<Percent className="h-5 w-5" aria-hidden />}
        />
      </div>
    </section>
  );
}
