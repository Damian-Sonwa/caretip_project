import { memo } from "react";
import { TrendingUp, Star, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmployeeStatCard } from "./EmployeeStatCard";
import { DashboardRefreshingBadge } from "../dashboard/DashboardAnalyticsLoader";
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
  metrics: EmployeePeriodMetrics;
};

function EmployeeDashboardMetricsGridInner({
  loading,
  isPeriodRefreshing,
  metrics,
}: EmployeeDashboardMetricsGridProps) {
  const { t } = useTranslation();
  const { periodTipCount, periodAmountEur, goalPct, rating } = metrics;

  return (
    <div
      className={cn(
        employeeUi.statsGrid,
        "relative transition-opacity duration-300",
        isPeriodRefreshing && "opacity-[0.94]",
      )}
    >
      {isPeriodRefreshing ? (
        <DashboardRefreshingBadge label={t("dashboard.refresh.updating")} />
      ) : null}
      <EmployeeStatCard
        featured
        loading={loading}
        showSpinner={loading}
        label={t("employee.dashboard.statTotalTips")}
        value={String(periodTipCount)}
        change={
          periodTipCount > 0
            ? t("employee.dashboard.statChangeEarned", {
                amount: formatEur(periodAmountEur),
                count: periodTipCount,
              })
            : t("format.metricZeroTips")
        }
        icon={<TrendingUp className="h-5 w-5" aria-hidden />}
      />
      <EmployeeStatCard
        loading={loading}
        showSpinner={loading}
        label={
          rating != null ? t("employee.dashboard.statAvgRating") : t("employee.dashboard.statRatings")
        }
        value={rating != null ? String(rating) : t("format.notAvailable")}
        change={rating != null ? undefined : t("format.metricZeroRatings")}
        icon={<Star className="h-5 w-5" aria-hidden />}
      />
      <EmployeeStatCard
        loading={loading}
        showSpinner={loading}
        label={t("employee.dashboard.statMonthlyGoal")}
        value={goalPct != null ? `${Math.round(goalPct)}%` : t("format.notAvailable")}
        change={
          goalPct != null
            ? t("employee.dashboard.statGoalProgress")
            : t("employee.dashboard.statGoalSetHint")
        }
        icon={<Target className="h-5 w-5" aria-hidden />}
      />
    </div>
  );
}

export const EmployeeDashboardMetricsGrid = memo(EmployeeDashboardMetricsGridInner);
