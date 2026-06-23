import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flame, Target, TrendingUp } from "lucide-react";
import type { EmployeeGoalProgress, TipItem } from "../../lib/api";
import { formatEur } from "../../lib/formatEur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeUi } from "../employee/employeeDashboardUi";
import { CountUpMetric } from "../dashboard/CountUpMetric";
import { cn } from "@/lib/utils";

type EmployeePerformanceInsightsProps = {
  tips: TipItem[];
  goalProgress: EmployeeGoalProgress | null;
  periodAmountEur: number;
  monthlyGoal: number | null;
  loading?: boolean;
};

/** Tip streak from DB tip dates in the current period list. Refresh: employee dashboard analytics hook. */
function computeTipStreakDays(tips: TipItem[]): number {
  if (tips.length === 0) return 0;
  const dayKeys = new Set(
    tips.map((t) => {
      const d = new Date(t.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!dayKeys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function EmployeePerformanceInsights({
  tips,
  goalProgress,
  periodAmountEur,
  monthlyGoal,
  loading,
}: EmployeePerformanceInsightsProps) {
  const { t } = useTranslation();

  const streak = useMemo(() => computeTipStreakDays(tips), [tips]);
  const goalPercent = goalProgress?.percent ?? (monthlyGoal && monthlyGoal > 0 ? Math.min(100, (periodAmountEur / monthlyGoal) * 100) : 0);

  return (
    <Card className={cn(employeeUi.cardStatic, "w-full")}>
      <CardHeader className={employeeUi.cardHeader}>
        <CardTitle className={employeeUi.cardTitle}>{t("employee.performance.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("employee.performance.rank")}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{t("kpiTrust.leaderboardComingSoon")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("kpiTrust.leaderboardComingSoonBody")}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">{t("employee.performance.goal")}</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {loading ? "—" : <CountUpMetric value={goalPercent} kind="percent" />}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {monthlyGoal ? t("employee.performance.goalTarget", { amount: formatEur(monthlyGoal) }) : t("employee.performance.goalOpen")}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Flame className="h-4 w-4 text-amber-600" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">{t("employee.performance.streak")}</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {loading ? "—" : t("employee.performance.streakDays", { count: streak })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("employee.performance.streakHint")}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">{t("employee.performance.trend")}</span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {loading ? "—" : <CountUpMetric value={periodAmountEur} kind="eur" />}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("employee.performance.trendHint")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
