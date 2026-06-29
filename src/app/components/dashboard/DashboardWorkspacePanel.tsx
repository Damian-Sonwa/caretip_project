import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardWorkspaceUi } from "./dashboardWorkspaceUi";

export type DashboardWorkspacePanelProps = {
  title: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Bordered list / feed panel for live activity and similar surfaces. */
export function DashboardWorkspacePanel({
  title,
  headerExtra,
  children,
  className,
}: DashboardWorkspacePanelProps) {
  return (
    <div className={cn(dashboardWorkspaceUi.card, "overflow-hidden shadow-sm", className)}>
      <div
        className={cn(
          dashboardWorkspaceUi.cardHeader,
          "flex items-center justify-between gap-3 bg-card",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <h3 className={cn(dashboardWorkspaceUi.subsectionTitle, "truncate")}>{title}</h3>
        </div>
        {headerExtra ? (
          <div className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {headerExtra}
          </div>
        ) : null}
      </div>
      <div className="relative bg-card">{children}</div>
    </div>
  );
}
