import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";

export type PremiumPageHeroProps = {
  children: ReactNode;
  className?: string;
  /** When true, omits min-height band (e.g. admin hero with custom height). */
  autoHeight?: boolean;
};

/**
 * Dashboard hero frame — wraps existing hero content without gradient accents.
 */
export function PremiumPageHero({ children, className, autoHeight = false }: PremiumPageHeroProps) {
  return (
    <div
      className={cn(
        premiumVisualClasses.hero,
        autoHeight && "min-h-0",
        className,
      )}
    >
      <div className={premiumVisualClasses.heroContent}>{children}</div>
    </div>
  );
}
