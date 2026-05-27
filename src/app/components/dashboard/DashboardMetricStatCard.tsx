import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardHeroMetricSkeleton } from "./DashboardAnalyticsLoader";

export type DashboardMetricStatCardTokens = {
  statCard: string;
  statLabel: string;
  statValue: string;
  statChange: string;
  featuredClass: string;
  labelRowClass: string;
  valueClass: string;
  changeClass: string;
};

export type DashboardMetricStatCardProps = {
  tokens: DashboardMetricStatCardTokens;
  label: string;
  value: ReactNode;
  /** Always reserves footer space; pass undefined for a neutral placeholder line. */
  change?: ReactNode;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
  loading?: boolean;
  showSpinner?: boolean;
};

const CHANGE_PLACEHOLDER = "\u00a0";

/**
 * Shared KPI card layout for business + employee dashboards.
 * Stable three-row structure: label → value → supporting text.
 */
export function DashboardMetricStatCard({
  tokens,
  label,
  value,
  change,
  icon,
  featured,
  className,
  loading,
  showSpinner = false,
}: DashboardMetricStatCardProps) {
  const changeVisible =
    !loading && change != null && change !== "" && change !== CHANGE_PLACEHOLDER;
  const changeContent = loading ? CHANGE_PLACEHOLDER : change ?? CHANGE_PLACEHOLDER;

  return (
    <div
      className={cn(
        tokens.statCard,
        "dashboard-metric-stat-card flex h-full flex-col",
        featured && tokens.featuredClass,
        loading && "opacity-[0.72]",
        className,
      )}
      aria-busy={loading || undefined}
    >
      <div
        className={cn(
          tokens.labelRowClass,
          "flex shrink-0 items-start justify-between gap-2",
        )}
      >
        <p className={cn(tokens.statLabel, "min-w-0 flex-1")}>{label}</p>
        {icon ? (
          <div className="shrink-0 text-primary/80" aria-hidden>
            {icon}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          tokens.statValue,
          tokens.valueClass,
          "dashboard-metric-stat-card__value shrink-0",
        )}
      >
        {loading ? (
          <DashboardHeroMetricSkeleton variant="currency" showSpinner={showSpinner} />
        ) : (
          <span className="dashboard-hero-metric-value--live block">{value}</span>
        )}
      </div>

      <p
        className={cn(
          tokens.statChange,
          tokens.changeClass,
          "dashboard-metric-stat-card__change shrink-0",
          loading && "text-muted-foreground/25",
          !changeVisible && !loading && "text-transparent select-none",
        )}
        aria-hidden={!changeVisible && !loading ? true : undefined}
      >
        {changeContent}
      </p>
    </div>
  );
}
