import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reserves chart/list panel height while loading so the page does not jump when
 * skeletons replace live content (or vice versa).
 */
export function DashboardStableChartSlot({
  loading,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
  className,
  skeleton,
  children,
}: {
  loading: boolean;
  minHeightClass?: string;
  className?: string;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative isolate h-full w-full min-h-0", minHeightClass, className)}>
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
