import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { businessUi } from "./businessDashboardUi";

type BusinessStatCardProps = {
  label: string;
  value: ReactNode;
  change?: ReactNode;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
};

export function BusinessStatCard({ label, value, change, icon, featured, className }: BusinessStatCardProps) {
  return (
    <div className={cn(businessUi.statCard, featured && "max-lg:col-span-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className={businessUi.statLabel}>{label}</p>
        {icon ? <div className="shrink-0 text-primary/80">{icon}</div> : null}
      </div>
      <p className={businessUi.statValue}>{value}</p>
      {change ? <p className={businessUi.statChange}>{change}</p> : null}
    </div>
  );
}
