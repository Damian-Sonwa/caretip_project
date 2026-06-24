import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";
import { heroPersonalityDataAttr } from "@/lib/heroPersonalitySystem";

export type PremiumPageHeroProps = {
  children: ReactNode;
  className?: string;
  /** When true, omits min-height band (e.g. admin hero with custom height). */
  autoHeight?: boolean;
  personality?: HeroPersonality;
};

/**
 * Dashboard hero frame — wraps existing hero content with premium surface tokens.
 */
export function PremiumPageHero({
  children,
  className,
  autoHeight = false,
  personality = "overview",
}: PremiumPageHeroProps) {
  return (
    <div
      className={cn(
        premiumVisualClasses.hero,
        autoHeight && "min-h-0",
        className,
      )}
      {...heroPersonalityDataAttr(personality)}
    >
      <div className={premiumVisualClasses.heroContent}>{children}</div>
    </div>
  );
}
