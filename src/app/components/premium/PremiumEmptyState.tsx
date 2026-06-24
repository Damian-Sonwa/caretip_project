import type { ReactNode } from "react";
import { CaretipPremiumBackdrop } from "@/app/components/premium/CaretipPremiumBackdrop";
import { cn } from "@/lib/utils";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";

export type PremiumEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

/**
 * Branded empty state — gradient header panel, clean body, optional CTA.
 */
export function PremiumEmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: PremiumEmptyStateProps) {
  return (
    <div
      className={cn(premiumVisualClasses.emptyState, compact && "premium-empty-state--compact", className)}
      role="status"
    >
      <div className="premium-empty-state__header">
        <CaretipPremiumBackdrop />
        {icon ? <div className="premium-empty-state__icon">{icon}</div> : null}
        <p className="premium-empty-state__title">{title}</p>
      </div>
      {(description || action) && (
        <div className={cn("premium-empty-state__body", compact && "!py-6")}>
          {description ? <p className="premium-empty-state__description">{description}</p> : null}
          {action ? <div className="premium-empty-state__action">{action}</div> : null}
        </div>
      )}
    </div>
  );
}
