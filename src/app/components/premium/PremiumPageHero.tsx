import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardWorkspaceUi } from "@/app/components/dashboard/dashboardWorkspaceUi";

export type PremiumPageHeroProps = {
  children: ReactNode;
  className?: string;
  /** When true, omits min-height band (e.g. admin hero with custom height). */
  autoHeight?: boolean;
  /** @deprecated Personality gradients removed — kept for API compatibility. */
  personality?: string;
};

/**
 * Flat dashboard page header region — no decorative container.
 */
export function PremiumPageHero({
  children,
  className,
  autoHeight = false,
}: PremiumPageHeroProps) {
  return (
    <div
      className={cn(
        dashboardWorkspaceUi.pageHeader,
        "premium-page-hero",
        autoHeight && "min-h-0",
        className,
      )}
    >
      <div className="premium-page-hero__content">{children}</div>
    </div>
  );
}
