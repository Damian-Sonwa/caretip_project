import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, UserCheck, Users, Wallet } from "lucide-react";
import { BusinessStatCard } from "../BusinessStatCard";
import { CountUpMetric } from "../../dashboard/CountUpMetric";
import { businessUi } from "../businessDashboardUi";
import { cn } from "@/lib/utils";
import {
  computeOperationalMetrics,
  type BusinessIntelligenceInput,
} from "../../../lib/businessIntelligence";

type OperationalMetricsCardsProps = {
  data: BusinessIntelligenceInput;
  loading: boolean;
};

export function OperationalMetricsCards({ data, loading }: OperationalMetricsCardsProps) {
  const { t } = useTranslation();
  const ops = useMemo(() => computeOperationalMetrics(data), [data]);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("business.team.performance.bi.operationalTitle")}
      </h2>
      <div className={cn(businessUi.statsGrid, "lg:grid-cols-4")}>
        <BusinessStatCard
          loading={loading}
          label={t("business.team.performance.bi.activeEmployees")}
          value={<CountUpMetric value={ops.activeEmployees} kind="integer" />}
          icon={<Users className="h-5 w-5" aria-hidden />}
        />
        <BusinessStatCard
          loading={loading}
          label={t("business.team.performance.bi.employeesWithTips")}
          value={<CountUpMetric value={ops.employeesReceivingTips} kind="integer" />}
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
        />
        <BusinessStatCard
          loading={loading}
          label={t("business.team.performance.bi.avgPerEmployee")}
          value={<CountUpMetric value={ops.averageTipsPerEmployee} kind="eur" />}
          icon={<Wallet className="h-5 w-5" aria-hidden />}
        />
        <BusinessStatCard
          loading={loading}
          label={t("business.team.performance.bi.avgPerShift")}
          value={<CountUpMetric value={ops.averageTipsPerShift} kind="eur" />}
          icon={<Clock className="h-5 w-5" aria-hidden />}
        />
      </div>
    </section>
  );
}
