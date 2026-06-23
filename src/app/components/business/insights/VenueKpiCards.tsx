import { useTranslation } from "react-i18next";
import { BusinessStatCard } from "../BusinessStatCard";
import { CountUpMetric } from "../../dashboard/CountUpMetric";
import { businessUi } from "../businessDashboardUi";
import { cn } from "@/lib/utils";
import { TrendingUp, Users, Heart, BarChart3 } from "lucide-react";
import type { BusinessDashboardStats } from "../../../lib/api";

type VenueKpiCardsProps = {
  monthTips: number;
  monthTipCount: number;
  employees: NonNullable<BusinessDashboardStats["employees"]>;
  goals: NonNullable<BusinessDashboardStats["employeeGoals"]>;
  pulse: BusinessDashboardStats["operationalPulse"] | null;
  loading: boolean;
};

export function VenueKpiCards({ monthTips, monthTipCount, employees, goals, pulse, loading }: VenueKpiCardsProps) {
  const { t } = useTranslation();

  const activeTippers = employees.filter((e) => e.tipCount > 0).length;
  const participation =
    employees.length > 0 ? Math.round((activeTippers / employees.length) * 100) : 0;
  const rated = employees.filter((e) => e.rating != null && e.rating > 0);
  const avgRating =
    rated.length > 0 ? rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length : 0;
  const goalsOnTrack = goals.filter((g) => g.status === "achieved" || g.status === "on_track").length;
  const goalRate = goals.length > 0 ? Math.round((goalsOnTrack / goals.length) * 100) : 0;

  return (
    <div className={cn(businessUi.statsGrid, "lg:grid-cols-4")}>
      <BusinessStatCard
        featured
        loading={loading}
        loadingVariant="currency"
        label={t("business.team.performance.kpi.growth")}
        value={<CountUpMetric value={monthTips} kind="eur" />}
        change={t("business.team.performance.kpi.growthHint", { count: monthTipCount })}
        icon={<TrendingUp className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.team.performance.kpi.revenue")}
        value={<CountUpMetric value={monthTips} kind="eur" />}
        change={t("business.team.performance.kpi.revenueHint")}
        icon={<BarChart3 className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.team.performance.kpi.participation")}
        value={<CountUpMetric value={participation} kind="percent" />}
        change={t("business.team.performance.kpi.participationHint", {
          active: pulse?.tippingReadyEmployees ?? activeTippers,
          total: pulse?.rosterTotal ?? employees.length,
        })}
        icon={<Users className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.team.performance.kpi.engagement")}
        value={
          avgRating > 0 ? (
            <CountUpMetric value={avgRating} kind="decimal" decimalPlaces={1} />
          ) : (
            <CountUpMetric value={goalRate} kind="percent" />
          )
        }
        change={
          avgRating > 0
            ? t("business.team.performance.kpi.engagementRating", { count: rated.length })
            : t("business.team.performance.kpi.engagementGoals", { percent: goalRate })
        }
        icon={<Heart className="h-5 w-5" aria-hidden />}
      />
    </div>
  );
}
