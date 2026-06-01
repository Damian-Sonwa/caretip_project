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
  ratingCount: number;
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
  const { periodTipCount, periodAmountEur, goalPct, rating, ratingCount } = metrics;
  const showEmptyTipsState =
    metricsSettledForPeriod && !loading && periodTipCount === 0;
  const cardsSettled = metricsSettledForPeriod && !loading;
  const showRatingValue = cardsSettled && rating != null;
  const showGoalValue = cardsSettled && goalPct != null;

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
          showRatingValue
            ? t("employee.dashboard.statAvgRating")
            : t("employee.dashboard.statRatings")
        }
        value={
          showRatingValue ? (
            <CountUpMetric value={rating} format={(n) => n.toFixed(1)} />
          ) : cardsSettled ? (
            t("format.notAvailable")
          ) : null
        }
        change={
          loading
            ? undefined
            : showRatingValue
              ? t("employee.dashboard.statRatingsCount", { count: ratingCount })
              : cardsSettled
                ? t("format.metricZeroRatings")
                : undefined
        }
        icon={<Star className="h-5 w-5" aria-hidden />}
      />
      <EmployeeStatCard
        loading={loading}
        label={t("employee.dashboard.statMonthlyGoal")}
        value={
          showGoalValue ? (
            <CountUpMetric value={goalPct} kind="percent" />
          ) : cardsSettled ? (
            t("format.notAvailable")
          ) : null
        }
        change={
          loading
            ? undefined
            : showGoalValue
              ? t("employee.dashboard.statGoalProgress")
              : cardsSettled
                ? t("employee.dashboard.statGoalSetHint")
                : undefined
        }
        icon={<CareIcon name="goals" size="md" />}
      />
    </div>
  );
}

export const EmployeeDashboardMetricsGrid = memo(EmployeeDashboardMetricsGridInner);
