import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";

export { DashboardRefreshIndicator } from "./DashboardRefreshIndicator";
export {
  AnalyticsLoadingState,
  DashboardAnalyticsPhaseHint,
  DashboardAnalyticsPhaseHintSlot,
  DashboardStableChartSlot,
  DeferredContentFade,
  DashboardMetricsGridSkeleton,
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
  showSpinner = false,
}: {
  variant?: "currency" | "count" | "pulse";
  className?: string;
  /** Subtle inline spinner (admin/employee dashboards); default off for unchanged consumers. */
  showSpinner?: boolean;
}) {
  return (
    <span
      className={cn(
        "dashboard-hero-metric-skeleton",
        variant === "count" && "dashboard-hero-metric-skeleton--count",
        variant === "pulse" && "dashboard-hero-metric-skeleton--pulse",
        variant === "currency" && "dashboard-hero-metric-skeleton--currency",
        showSpinner && "dashboard-hero-metric-skeleton--with-spinner",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {showSpinner ? (
        <LoadingSpinner size="sm" className="dashboard-hero-metric-skeleton__spinner shrink-0" />
      ) : null}
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

function DashboardChartBarsPlaceholder({
  barHeights,
}: {
  barHeights: number[];
}) {
  return (
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
  );
}

function DashboardChartTrendPlaceholder() {
  return (
    <>
      <div
        className="pointer-events-none absolute bottom-7 left-12 right-3 top-3 sm:left-14"
        aria-hidden
      >
        <svg
          className="h-full w-full text-muted-foreground/25"
          viewBox="0 0 320 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,92 C40,88 55,72 95,58 S155,38 200,42 280,28 320,18 L320,120 L0,120 Z"
            fill="currentColor"
            opacity="0.12"
          />
          <path
            d="M0,92 C40,88 55,72 95,58 S155,38 200,42 280,28 320,18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      </div>
      <div
        className="absolute bottom-1.5 left-12 right-3 flex justify-between sm:left-14"
        aria-hidden
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="dashboard-chart-skeleton__bar h-2 w-5 max-w-[2.25rem] rounded-sm opacity-60"
          />
        ))}
      </div>
      <div
        className="absolute bottom-7 left-1.5 top-3 flex w-9 flex-col justify-between sm:left-2"
        aria-hidden
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="dashboard-chart-skeleton__bar h-2 w-7 rounded-sm opacity-50"
          />
        ))}
      </div>
    </>
  );
}

/** Chart placeholder — bar columns or area/trend frame with axis ticks. */
export function DashboardChartSkeleton({
  className,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
  barHeights = [42, 68, 35, 82, 55, 74, 48, 90, 62, 40],
  variant = "bars",
}: {
  className?: string;
  minHeightClass?: string;
  barHeights?: number[];
  variant?: "bars" | "trend";
}) {
  return (
    <div
      className={cn(
        "dashboard-chart-skeleton relative flex w-full flex-col justify-end px-1",
        minHeightClass,
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
    >
      {variant === "trend" ? (
        <div className="relative h-full min-h-[120px] w-full flex-1">
          <DashboardChartTrendPlaceholder />
        </div>
      ) : (
        <DashboardChartBarsPlaceholder barHeights={barHeights} />
      )}
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-[2px]">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-500/25" aria-hidden />
        {label}
      </span>
    </div>
  );
}
