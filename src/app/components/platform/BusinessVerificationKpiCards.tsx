import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { KycQueueMetrics } from "../../lib/api";
import type { PlatformBusinessStatusFilter } from "../../lib/api";

type KpiKey = Extract<
  PlatformBusinessStatusFilter,
  "pending_review" | "awaiting_upload" | "sla_breach" | "verified"
>;

type BusinessVerificationKpiCardsProps = {
  metrics: KycQueueMetrics;
  activeStatus: PlatformBusinessStatusFilter;
  onToggleStatus: (status: KpiKey) => void;
};

const KPI_CONFIG: Array<{
  key: KpiKey;
  labelKey: string;
  valueKey: keyof KycQueueMetrics;
  warnWhenPositive?: boolean;
}> = [
  { key: "verified", labelKey: "admin.businessVerificationPage.kpi.verified", valueKey: "verified" },
  { key: "pending_review", labelKey: "admin.businessVerificationPage.kpi.pendingReview", valueKey: "pendingReview" },
  { key: "awaiting_upload", labelKey: "admin.businessVerificationPage.kpi.awaitingUpload", valueKey: "awaitingUpload" },
  {
    key: "sla_breach",
    labelKey: "admin.businessVerificationPage.kpi.slaBreach",
    valueKey: "slaBreached",
    warnWhenPositive: true,
  },
];

export function BusinessVerificationKpiCards({
  metrics,
  activeStatus,
  onToggleStatus,
}: BusinessVerificationKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CONFIG.map(({ key, labelKey, valueKey, warnWhenPositive }) => {
        const isActive = activeStatus === key;
        const value = metrics[valueKey];
        const numericValue = typeof value === "number" ? value : 0;
        const showWarn = warnWhenPositive && numericValue > 0;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggleStatus(key)}
            aria-pressed={isActive}
            className={cn(
              "rounded-lg border p-3 text-left text-sm transition-colors",
              isActive
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-border bg-card hover:bg-muted/40",
              showWarn && !isActive && "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
            )}
          >
            <div className={cn("text-muted-foreground", isActive && "text-primary font-medium")}>
              {t(labelKey, { hours: metrics.slaHours })}
            </div>
            <div
              className={cn(
                "text-2xl font-semibold tabular-nums",
                showWarn ? "text-amber-700 dark:text-amber-400" : "text-foreground",
                isActive && "text-primary",
              )}
            >
              {numericValue}
            </div>
          </button>
        );
      })}
    </div>
  );
}
