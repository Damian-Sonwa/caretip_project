import { memo } from "react";
import { Star } from "lucide-react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";
import { EmployeeStatCard } from "./EmployeeStatCard";
import { CountUpMetric } from "../dashboard/CountUpMetric";
import { formatEur } from "../../lib/formatEur";
import { employeeUi } from "./employeeDashboardUi";
import { cn } from "@/lib/utils";
import type { EmployeeAnalyticsTimeframe } from "../../hooks/useEmployeeDashboardAnalytics";

export type EmployeePeriodMetrics = {
  periodTipCount: number;
  periodAmountEur: number;
  goalPct: number | null;
  rating: number | null;
};

type EmployeeDashboardMetricsGridProps = {
  loading: boolean;
  isPeriodRefreshing: boolean;
  /** True only after the active period fetch finished (avoids empty-state flash). */
  metricsSettledForPeriod: boolean;
  metrics: EmployeePeriodMetrics;
};

function EmployeeDashboardMetricsGridInner({
  loading,
  isPeriodRefreshing,
  metricsSettledForPeriod,
  metrics,
}: EmployeeDashboardMetricsGridProps) {
  const { t } = useTranslation();
  const { periodTipCount, periodAmountEur, goalPct, rating } = metrics;
  const showEmptyTipsState =
    metricsSettledForPeriod && !loading && periodTipCount === 0;

  return (
    <div
      className={cn(
        employeeUi.statsGrid,
        "relative transition-opacity duration-300",
        isPeriodRefreshing && "opacity-[0.94]",
      )}
    >
      <EmployeeStatCard
        featured
        loading={loading}
        label={t("employee.dashboard.statTotalTips")}
        value={<CountUpMetric value={periodTipCount} kind="integer" />}
        change={
          showEmptyTipsState
            ? t("format.metricZeroTips")
            : t("employee.dashboard.statChangeEarned", {
                amount: formatEur(periodAmountEur),
                count: periodTipCount,
              })
        }
        icon={<CareIcon name="tips" size="md" />}
      />
      <EmployeeStatCard
        loading={loading}
        label={
          rating != null ? t("employee.dashboard.statAvgRating") : t("employee.dashboard.statRatings")
        }
        value={
          loading ? null : rating != null ? (
            <CountUpMetric value={rating} format={(n) => String(n)} />
          ) : metricsSettledForPeriod ? (
            t("format.notAvailable")
          ) : null
        }
        change={
          loading
            ? undefined
            : rating != null
              ? undefined
              : metricsSettledForPeriod
                ? t("format.metricZeroRatings")
                : undefined
        }
        icon={<Star className="h-5 w-5" aria-hidden />}
      />
      <EmployeeStatCard
        loading={loading}
        label={t("employee.dashboard.statMonthlyGoal")}
        value={
          loading ? null : goalPct != null ? (
            <CountUpMetric value={goalPct} kind="percent" />
          ) : metricsSettledForPeriod ? (
            t("format.notAvailable")
          ) : null
        }
        change={
          loading
            ? undefined
            : goalPct != null
              ? t("employee.dashboard.statGoalProgress")
              : metricsSettledForPeriod
                ? t("employee.dashboard.statGoalSetHint")
                : undefined
        }
        icon={<CareIcon name="goals" size="md" />}
      />
    </div>
  );
}

export const EmployeeDashboardMetricsGrid = memo(EmployeeDashboardMetricsGridInner);
