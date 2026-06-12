import { memo } from "react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";
import { BusinessStatCard } from "./BusinessStatCard";
import { CountUpMetric } from "../dashboard/CountUpMetric";
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
      <BusinessStatCard
        featured
        loading={loading}
        loadingVariant="currency"
        label={
          analyticsTimeframe === "week"
            ? t("business.dashboard.statsTotalTipsWeek")
            : analyticsTimeframe === "month"
              ? t("business.dashboard.statsTotalTipsMonth")
              : t("business.dashboard.statsTotalTipsYear")
        }
        value={<CountUpMetric value={totalTips} kind="eur" />}
        change={
          hasTipActivityInPeriod
            ? t("business.dashboard.statsLiveTotals", { count: tipCount })
            : t("format.metricZeroTips")
        }
        icon={<CareIcon name="earnings" size="md" />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.dashboard.activeEmployees")}
        value={<CountUpMetric value={employeeCount} kind="integer" />}
        change={
          topPerformersCount > 0
            ? t("business.dashboard.activeEmployeesTopHint", { count: topPerformersCount })
            : undefined
        }
        icon={<CareIcon name="team" size="md" />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.dashboard.tipsCount")}
        value={<CountUpMetric value={tipCount} kind="integer" />}
        change={hasTipActivityInPeriod ? undefined : t("format.metricZeroTips")}
        icon={<CareIcon name="employeePerformance" size="md" />}
      />
      <BusinessStatCard
        loading={loading}
        label={t("business.dashboard.avgTipPerEmployee")}
        value={
          <CountUpMetric
            value={employeeCount > 0 ? totalTips / employeeCount : 0}
            kind="eur-whole"
          />
        }
        change={hasTipActivityInPeriod && employeeCount > 0 ? undefined : t("format.metricZeroTips")}
        icon={<CareIcon name="analytics" size="md" />}
      />
    </div>
  );
}

export const BusinessDashboardMetricsGrid = memo(BusinessDashboardMetricsGridInner);
