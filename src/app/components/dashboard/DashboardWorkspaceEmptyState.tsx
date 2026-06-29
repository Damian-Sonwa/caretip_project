import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardWorkspaceUi } from "./dashboardWorkspaceUi";

export type DashboardWorkspaceEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function DashboardWorkspaceEmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: DashboardWorkspaceEmptyStateProps) {
  return (
    <div
      className={cn(
        dashboardWorkspaceUi.card,
        "flex flex-col items-center text-center",
        compact ? "px-4 py-8 sm:px-6" : "px-4 py-10 sm:px-6 sm:py-12",
        className,
      )}
      role="status"
    >
      {icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className={cn(dashboardWorkspaceUi.subsectionTitle, icon ? "mt-4" : "")}>{title}</p>
      {description ? (
        <p className={cn(dashboardWorkspaceUi.helperText, "mt-1.5 max-w-sm")}>{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
