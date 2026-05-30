import { memo } from "react";
import { cn } from "@/lib/utils";
import type { DashboardStatusItem } from "@/app/lib/dashboardStatus/types";
import { DashboardStatusBadge } from "./DashboardStatusBadge";

export type DashboardStatusStripProps = {
  items: DashboardStatusItem[];
  className?: string;
  /** Reserve one row height while loading (avoids CLS). */
  placeholder?: boolean;
};

export const DashboardStatusStrip = memo(function DashboardStatusStrip({
  items,
  className,
  placeholder,
}: DashboardStatusStripProps) {
  if (placeholder) {
    return (
      <div
        className={cn("flex min-h-[1.75rem] flex-wrap items-center gap-2", className)}
        aria-hidden
      />
    );
  }

  if (items.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      aria-label="Status"
    >
      {items.map((item) => (
        <DashboardStatusBadge
          key={item.id}
          tone={item.tone}
          label={item.label}
          description={item.description}
        />
      ))}
    </div>
  );
});
