import { memo, type ReactNode } from "react";
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
  /** Keep values visible during background period refresh. */
  refreshing?: boolean;
  refreshingLabel?: ReactNode;
  showSpinner?: boolean;
  loadingVariant?: "currency" | "count" | "pulse";
};

const CHANGE_PLACEHOLDER = "\u00a0";

/**
 * Shared KPI card layout for business, employee, and platform dashboards.
 * Three-row grid: label → value → supporting text — aligned across cards in a row.
 */
function DashboardMetricStatCardInner({
  tokens,
  label,
  value,
  change,
  icon,
  featured,
  className,
  loading,
  refreshing = false,
  refreshingLabel,
  showSpinner = false,
  loadingVariant = "currency",
}: DashboardMetricStatCardProps) {
  const changeVisible =
    !loading &&
    !refreshing &&
    change != null &&
    change !== "" &&
    change !== CHANGE_PLACEHOLDER;
  const changeContent = loading ? CHANGE_PLACEHOLDER : change ?? CHANGE_PLACEHOLDER;

  return (
    <div
      className={cn(
        tokens.statCard,
        "dashboard-metric-stat-card relative h-full overflow-hidden",
        featured && tokens.featuredClass,
        loading && "opacity-[0.72]",
        refreshing && !loading && "dashboard-metric-stat-card--refreshing",
        className,
      )}
      aria-busy={loading || refreshing || undefined}
    >
      <div
        className={cn(
          tokens.labelRowClass,
          "dashboard-metric-stat-card__header dashboard-metric-stat-card__label-row flex min-w-0 items-start justify-between gap-2.5",
        )}
      >
        <p
          className={cn(
            tokens.statLabel,
            "dashboard-metric-stat-card__label min-w-0 flex-1 basis-0",
          )}
        >
          {label}
        </p>
        {icon ? (
          <div className="dashboard-metric-stat-card__icon shrink-0" aria-hidden>
            {icon}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          tokens.statValue,
          tokens.valueClass,
          "dashboard-metric-stat-card__value flex min-h-[2.25rem] items-end sm:min-h-[2.5rem]",
        )}
      >
        {loading ? (
          <DashboardHeroMetricSkeleton variant={loadingVariant} showSpinner={showSpinner} />
        ) : (
          <span className="dashboard-hero-metric-value--live block w-full min-w-0">{value}</span>
        )}
      </div>

      <p
        className={cn(
          tokens.statChange,
          tokens.changeClass,
          "dashboard-metric-stat-card__change",
          loading && "text-muted-foreground/25",
          !changeVisible && !loading && !refreshing && "text-transparent select-none",
        )}
        aria-hidden={!changeVisible && !loading && !refreshing ? true : undefined}
      >
        {loading ? (
          <span
            className="dashboard-hero-metric-skeleton__bar mt-0.5 block h-2.5 w-[52%] max-w-[8.5rem] rounded-md"
            aria-hidden
          />
        ) : refreshing ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500/80" aria-hidden />
            {refreshingLabel}
          </span>
        ) : (
          changeContent
        )}
      </p>
    </div>
  );
}

export const DashboardMetricStatCard = memo(DashboardMetricStatCardInner);
