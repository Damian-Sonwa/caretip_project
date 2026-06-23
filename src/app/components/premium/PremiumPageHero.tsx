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
 * Branded gradient frame for dashboard heroes — wraps existing hero content without changing layout.
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
      <div className="premium-page-hero__glow" aria-hidden />
      <div className={premiumVisualClasses.heroContent}>{children}</div>
    </div>
  );
}
