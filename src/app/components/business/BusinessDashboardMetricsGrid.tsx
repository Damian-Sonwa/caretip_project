import { memo } from "react";
import { Euro, Users, Award, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BusinessStatCard } from "./BusinessStatCard";
import { DashboardRefreshingBadge } from "../dashboard/DashboardAnalyticsLoader";
import { formatEur } from "../../lib/formatEur";
import { businessUi } from "./businessDashboardUi";
import { cn } from "@/lib/utils";
import type { AnalyticsTimeframe } from "../../hooks/useBusinessDashboardStats";

export type BusinessDashboardMetrics = {
  totalTips: number;
  tipCount: number;
  employeeCount: number;
};

type BusinessDashboardMetricsGridProps = {
  analyticsTimeframe: AnalyticsTimeframe;
  metrics: BusinessDashboardMetrics | null;
  loading: boolean;
  isPeriodRefreshing: boolean;
  hasTipActivityInPeriod: boolean;
  topPerformersCount: number;
};

function BusinessDashboardMetricsGridInner({
  analyticsTimeframe,
  metrics,
  loading,
  isPeriodRefreshing,
  hasTipActivityInPeriod,
  topPerformersCount,
}: BusinessDashboardMetricsGridProps) {
  const { t } = useTranslation();
  const totalTips = metrics?.totalTips ?? 0;
  const tipCount = metrics?.tipCount ?? 0;
  const employeeCount = metrics?.employeeCount ?? 0;

  return (
    <div
      className={cn(
        businessUi.statsGrid,
        "relative transition-opacity duration-300",
        isPeriodRefreshing && "opacity-[0.94]",
      )}
    >
      {isPeriodRefreshing ? (
        <DashboardRefreshingBadge label={t("dashboard.refresh.updating")} />
      ) : null}
      <BusinessStatCard
        featured
        loading={loading}
        label={
          analyticsTimeframe === "week"
            ? t("business.dashboard.statsTotalTipsWeek")
            : analyticsTimeframe === "month"
              ? t("business.dashboard.statsTotalTipsMonth")
              : t("business.dashboard.statsTotalTipsYear")
        }
        value={formatEur(totalTips)}
        change={
          hasTipActivityInPeriod
            ? t("business.dashboard.statsLiveTotals")
            : t("format.metricZeroTips")
        }
        icon={<Euro className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.dashboard.activeEmployees")}
        value={String(employeeCount)}
        change={t("business.dashboard.activeEmployeesTopHint", {
          count: topPerformersCount,
        })}
        icon={<Users className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.dashboard.tipsCount")}
        value={String(tipCount)}
        change={
          hasTipActivityInPeriod
            ? t("business.dashboard.tipsCountHint")
            : t("format.metricZeroTips")
        }
        icon={<Award className="h-5 w-5" aria-hidden />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.dashboard.avgTipPerEmployee")}
        value={
          employeeCount > 0
            ? formatEur(totalTips / employeeCount, { minFrac: 0, maxFrac: 0 })
            : formatEur(0, { minFrac: 0, maxFrac: 0 })
        }
        change={t("business.dashboard.avgTipCoaching")}
        icon={<TrendingUp className="h-5 w-5" aria-hidden />}
      />
    </div>
  );
}

export const BusinessDashboardMetricsGrid = memo(BusinessDashboardMetricsGridInner);
