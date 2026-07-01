import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { OnboardingQueueMetrics, PlatformBusinessStatusFilter } from "../../lib/api";

type OnboardingKpiKey = Extract<
  PlatformBusinessStatusFilter,
  "submitted" | "approved" | "rejected"
>;

type BusinessOnboardingKpiCardsProps = {
  metrics: OnboardingQueueMetrics;
  activeStatus: PlatformBusinessStatusFilter;
  onToggleStatus: (status: OnboardingKpiKey) => void;
};

const KPI_CONFIG: Array<{
  key: OnboardingKpiKey;
  labelKey: string;
  valueKey: keyof Pick<OnboardingQueueMetrics, "submitted" | "approved" | "rejected">;
  warnWhenPositive?: boolean;
}> = [
  { key: "submitted", labelKey: "admin.onboardingVerificationPage.kpi.submitted", valueKey: "submitted", warnWhenPositive: true },
  { key: "approved", labelKey: "admin.onboardingVerificationPage.kpi.approved", valueKey: "approved" },
  { key: "rejected", labelKey: "admin.onboardingVerificationPage.kpi.rejected", valueKey: "rejected" },
];

export function BusinessOnboardingKpiCards({
  metrics,
  activeStatus,
  onToggleStatus,
}: BusinessOnboardingKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
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
              {t(labelKey)}
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
