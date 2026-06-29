import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { employeeUi } from "./employeeDashboardUi";

type EmployeePageHeaderProps = {
  title: string;
  description?: string;
  backTo?: string;
  backAriaLabel?: string;
  actions?: ReactNode;
  leading?: ReactNode;
  className?: string;
};

export function EmployeePageHeader({
  title,
  description,
  backTo = "/employee/dashboard",
  backAriaLabel = "Back",
  actions,
  leading,
  className,
}: EmployeePageHeaderProps) {
  return (
    <header className={cn(employeeUi.pageHeader, className)}>
      <div className={employeeUi.pageHeaderInner}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Link
            to={backTo}
            className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            {backAriaLabel}
          </Link>
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <div className="min-w-0 flex-1">
            <h1 className={employeeUi.pageTitle}>{title}</h1>
            {description ? <p className={employeeUi.pageDesc}>{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
