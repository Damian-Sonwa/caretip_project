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
    <div
      className={cn(
        businessUi.statCard,
        "h-full",
        featured && "business-stat-card--featured",
        className,
      )}
    >
      <div className="business-stat-card__label-row flex items-start justify-between gap-2">
        <p className={businessUi.statLabel}>{label}</p>
        {icon ? <div className="shrink-0 text-primary/80">{icon}</div> : null}
      </div>
      <p className={cn(businessUi.statValue, "business-stat-card__value")}>{value}</p>
      {change ? <p className={cn(businessUi.statChange, "business-stat-card__change")}>{change}</p> : null}
    </div>
  );
}
