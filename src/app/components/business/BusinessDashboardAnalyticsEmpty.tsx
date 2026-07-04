import type { ReactNode } from "react";
import { DashboardWorkspaceEmptyState } from "../dashboard/DashboardWorkspaceEmptyState";
import { cn } from "@/lib/utils";

type BusinessDashboardAnalyticsEmptyProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Chart cards use the subtle grid backdrop; list panels stay flat. */
  variant?: "chart" | "panel";
};

/** Compact, centered empty state for business dashboard analytics sections. */
export function BusinessDashboardAnalyticsEmpty({
  icon,
  title,
  description,
  action,
  className,
  variant = "chart",
}: BusinessDashboardAnalyticsEmptyProps) {
  return (
    <div
      className={cn(
        "business-dashboard-analytics-empty",
        variant === "chart" && "business-dashboard-chart-empty",
        className,
      )}
    >
      <DashboardWorkspaceEmptyState
        compact
        icon={icon}
        title={title}
        description={description}
        action={action}
        className="border-0 bg-transparent px-2 py-4 shadow-none sm:px-4"
      />
    </div>
  );
}
