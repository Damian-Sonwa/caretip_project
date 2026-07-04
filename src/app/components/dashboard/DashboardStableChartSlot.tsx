import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reserves chart/list panel height while loading so the page does not jump when
 * skeletons replace live content (or vice versa).
 *
 * Chart children mount only after loading completes so Recharts measures a visible
 * container (avoids zero-size / permanently hidden surfaces on first paint).
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
      {loading ? (
        <div className={cn("h-full w-full min-h-0", minHeightClass)} aria-busy="true">
          {skeleton}
        </div>
      ) : (
        <div className="h-full w-full min-h-0">{children}</div>
      )}
    </div>
  );
}
