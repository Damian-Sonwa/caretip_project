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

/** Hero pulse / account stat placeholder — soft pulse, no skeleton bars. */
export function DashboardHeroStatPlaceholder() {
  return (
    <span className="inline-block min-w-[3ch] tabular-nums text-muted-foreground/30 animate-pulse">
      —
    </span>
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
