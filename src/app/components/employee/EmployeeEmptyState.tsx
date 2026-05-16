import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { employeeUi } from "./employeeDashboardUi";

type EmployeeEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmployeeEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmployeeEmptyStateProps) {
  return (
    <div className={cn(employeeUi.emptyWrap, className)}>
      {icon ? <div className={employeeUi.emptyIcon}>{icon}</div> : null}
      <p className={employeeUi.emptyTitle}>{title}</p>
      {description ? <p className={employeeUi.emptyDesc}>{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
