import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";

export { DashboardRefreshIndicator } from "./DashboardRefreshIndicator";
export {
  AnalyticsLoadingState,
  DashboardAnalyticsPhaseHint,
  DeferredContentFade,
  GoalsTableLoadingShell,
  InlineSpinner,
  SectionLoader,
} from "./DashboardSectionLoading";

type SpinnerSize = "sm" | "md" | "lg";

/** Centered spinner for chart / table regions — no skeleton chrome. */
export function DashboardSectionSpinner({
  className,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
  size = "sm",
  label,
  ariaLabel = "Loading",
}: {
  className?: string;
  minHeightClass?: string;
  size?: SpinnerSize;
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={cn("flex w-full items-center justify-center", minHeightClass, className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size={size} className="text-primary/70" />
        {label ? (
          <p className="text-xs font-medium tracking-wide text-muted-foreground/75">{label}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Compact loader for the KPI stat grid on first paint. */
export function DashboardStatsGridSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full min-h-[128px] items-center justify-center sm:min-h-[136px]",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner size="sm" className="text-primary/70" />
    </div>
  );
}

/** Inline shimmer placeholder inside hero metric cells (currency, count, or pulse + subline). */
export function DashboardHeroMetricSkeleton({
  variant = "currency",
  className,
}: {
  variant?: "currency" | "count" | "pulse";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "dashboard-hero-metric-skeleton",
        variant === "count" && "dashboard-hero-metric-skeleton--count",
        variant === "pulse" && "dashboard-hero-metric-skeleton--pulse",
        variant === "currency" && "dashboard-hero-metric-skeleton--currency",
        className,
      )}
      role="status"
      aria-busy="true"
    >
      <span className="dashboard-hero-metric-skeleton__bar" aria-hidden />
      {variant === "pulse" ? (
        <span className="dashboard-hero-metric-skeleton__sub" aria-hidden />
      ) : null}
    </span>
  );
}

/** @deprecated Use DashboardHeroMetricSkeleton */
export function DashboardHeroStatPlaceholder() {
  return <DashboardHeroMetricSkeleton variant="currency" />;
}

/** Chart region placeholder — bar silhouette, no centered spinner. */
export function DashboardChartSkeleton({
  className,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
  barHeights = [42, 68, 35, 82, 55, 74, 48, 90, 62, 40],
}: {
  className?: string;
  minHeightClass?: string;
  barHeights?: number[];
}) {
  return (
    <div
      className={cn(
        "dashboard-chart-skeleton flex w-full flex-col justify-end px-1",
        minHeightClass,
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
    >
      <div className="flex h-[72%] min-h-[120px] w-full items-end justify-between gap-1 sm:gap-1.5">
        {barHeights.map((h, i) => (
          <span
            key={i}
            className="dashboard-chart-skeleton__bar flex-1 rounded-t-md"
            style={{ height: `${h}%` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

/** Small pill overlay while period stats refresh (employee + business). */
export function DashboardRefreshingBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/50 backdrop-blur-[2px]">
        <LoadingSpinner size="sm" className="!h-3 !w-3 border-[1.5px]" />
        {label}
      </span>
    </div>
  );
}
