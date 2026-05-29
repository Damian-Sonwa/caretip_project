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
    <div className={cn("relative isolate w-full", minHeightClass, className)}>
      <div
        className={cn("w-full", minHeightClass, loading && "pointer-events-none invisible")}
        aria-hidden={loading || undefined}
      >
        {children}
      </div>
      {loading ? (
        <div className={cn("absolute inset-0 z-[1] w-full", minHeightClass)} aria-busy="true">
          {skeleton}
        </div>
      ) : null}
    </div>
  );
}
