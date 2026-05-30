import { memo } from "react";
import { cn } from "@/lib/utils";
import type { DashboardStatusTone } from "@/app/lib/dashboardStatus/types";

const toneClass: Record<DashboardStatusTone, string> = {
  live: "border-emerald-500/25 bg-emerald-500/[0.06] text-foreground",
  updating: "border-amber-500/25 bg-amber-500/[0.06] text-foreground",
  action: "border-red-500/25 bg-red-500/[0.06] text-foreground",
};

const dotClass: Record<DashboardStatusTone, string> = {
  live: "bg-emerald-500 ring-2 ring-emerald-500/20",
  updating: "bg-amber-500 ring-2 ring-amber-500/20",
  action: "bg-red-500 ring-2 ring-red-500/20",
};

export type DashboardStatusBadgeProps = {
  tone: DashboardStatusTone;
  label: string;
  description?: string;
  className?: string;
};

export const DashboardStatusBadge = memo(function DashboardStatusBadge({
  tone,
  label,
  description,
  className,
}: DashboardStatusBadgeProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
      title={description}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass[tone])} aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
});
