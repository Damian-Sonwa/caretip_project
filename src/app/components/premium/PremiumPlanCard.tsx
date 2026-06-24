import type { ReactNode } from "react";
import { CaretipPremiumBackdrop } from "@/app/components/premium/CaretipPremiumBackdrop";
import { cn } from "@/lib/utils";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";

export type PremiumPlanCardProps = {
  badge?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  upgradeAction?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * Premium gradient shell for the current billing plan summary.
 */
export function PremiumPlanCard({
  badge,
  title,
  subtitle,
  meta,
  upgradeAction,
  children,
  className,
}: PremiumPlanCardProps) {
  return (
    <div className={cn(premiumVisualClasses.planCard, className)}>
      <CaretipPremiumBackdrop />
      <div className="premium-plan-card__inner p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {badge ? <div className="mb-2">{badge}</div> : null}
            <div className="text-white">{title}</div>
            {subtitle ? <div className="mt-2 text-sm text-white/78">{subtitle}</div> : null}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {meta}
            {upgradeAction}
          </div>
        </div>
        {children ? (
          <div className="premium-plan-card__details mt-6 p-4 sm:p-5">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
