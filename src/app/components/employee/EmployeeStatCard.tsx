import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { employeeUi } from "./employeeDashboardUi";

type EmployeeStatCardProps = {
  label: string;
  value: ReactNode;
  change?: ReactNode;
  icon?: ReactNode;
  /** On viewports below `lg`, span full width of the stats grid. */
  featured?: boolean;
  className?: string;
};

export function EmployeeStatCard({ label, value, change, icon, featured, className }: EmployeeStatCardProps) {
  return (
    <div
      className={cn(
        employeeUi.statCard,
        featured && "max-lg:col-span-2 employee-stat-card--featured",
        className,
      )}
    >
      <div className="employee-stat-card__label-row flex items-start justify-between gap-2">
        <p className={employeeUi.statLabel}>{label}</p>
        {icon ? <div className="shrink-0 text-primary/80">{icon}</div> : null}
      </div>
      <p className={cn(employeeUi.statValue, "employee-stat-card__value")}>{value}</p>
      {change ? <p className={cn(employeeUi.statChange, "employee-stat-card__change")}>{change}</p> : null}
    </div>
  );
}
