import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reserves chart/list panel height while loading so the page does not jump when
 * skeletons replace live content (or vice versa).
 */
export function DashboardStableChartSlot({
  loading,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
  contentMinHeightClass,
  className,
  skeleton,
  children,
}: {
  loading: boolean;
  minHeightClass?: string;
  /** Settled content height — use `min-h-0` for compact empty states. Defaults to minHeightClass. */
  contentMinHeightClass?: string;
  className?: string;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  const settledMinHeight = loading
    ? minHeightClass
    : (contentMinHeightClass ?? minHeightClass);

  return (
    <div className={cn("relative isolate h-full w-full min-h-0", settledMinHeight, className)}>
      <div
        className={cn(
          "h-full w-full min-h-0",
          loading && "pointer-events-none invisible",
        )}
        aria-hidden={loading || undefined}
      >
        {children}
      </div>
      {loading ? (
        <div className={cn("absolute inset-0 z-[1] h-full w-full", minHeightClass)} aria-busy="true">
          {skeleton}
        </div>
      ) : null}
    </div>
  );
}
