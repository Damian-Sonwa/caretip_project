import { useTranslation } from "react-i18next";
import { BusinessStatCard } from "../BusinessStatCard";
import { CountUpMetric } from "../../dashboard/CountUpMetric";
import { formatEur } from "../../../lib/formatEur";
import { businessUi } from "../businessDashboardUi";
import { cn } from "@/lib/utils";
import type { TipsPeriodSnapshot } from "../../../hooks/useBusinessTipsModuleData";
import { Coins, CalendarDays, TrendingUp, Sparkles } from "lucide-react";

type TipsOverviewMetricCardsProps = {
  today: TipsPeriodSnapshot;
  week: TipsPeriodSnapshot;
  month: TipsPeriodSnapshot;
  loading: boolean;
};

export function TipsOverviewMetricCards({ today, week, month, loading }: TipsOverviewMetricCardsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn(businessUi.statsGrid, "lg:grid-cols-4")}>
      <BusinessStatCard
        featured
        loading={loading}
        loadingVariant="currency"
        label={t("business.tips.live.cards.today")}
        value={<CountUpMetric value={today.totalTips} kind="eur" />}
        change={t("business.tips.live.cards.tipCount", { count: today.tipCount })}
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        loadingVariant="currency"
        label={t("business.tips.live.cards.week")}
        value={<CountUpMetric value={week.totalTips} kind="eur" />}
        change={t("business.tips.live.cards.tipCount", { count: week.tipCount })}
        icon={<CalendarDays className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        loadingVariant="currency"
        label={t("business.tips.live.cards.month")}
        value={<CountUpMetric value={month.totalTips} kind="eur" />}
        change={t("business.tips.live.cards.tipCount", { count: month.tipCount })}
        icon={<Coins className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        loadingVariant="currency"
        label={t("business.tips.live.cards.average")}
        value={<CountUpMetric value={month.averageTip} kind="eur" format={formatEur} />}
        change={t("business.tips.live.cards.averageHint")}
        icon={<TrendingUp className="h-5 w-5" aria-hidden />}
      />
    </div>
  );
}
