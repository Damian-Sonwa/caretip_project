import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardPeriodUi } from "./dashboardPeriodUi";

export type DashboardPeriodOption<T extends string> = {
  id: T;
  label: ReactNode;
  loading?: boolean;
};

type DashboardAnalyticsPeriodToggleProps<T extends string> = {
  options: DashboardPeriodOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
};

export function DashboardAnalyticsPeriodToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: DashboardAnalyticsPeriodToggleProps<T>) {
  return (
    <div
      className={cn(dashboardPeriodUi.periodToggle, className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={cn(
              dashboardPeriodUi.periodBtn,
              active ? dashboardPeriodUi.periodBtnActive : dashboardPeriodUi.periodBtnIdle,
            )}
          >
            <span className={dashboardPeriodUi.periodBtnLabel}>{opt.label}</span>
            {opt.loading ? (
              <span className={dashboardPeriodUi.periodBtnLoadingDot} aria-hidden>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current/70" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
