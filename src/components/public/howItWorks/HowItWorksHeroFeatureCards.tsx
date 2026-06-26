import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { JourneyPillarIcon } from "@/components/public/JourneyPillarIcon";
import { cn } from "@/lib/utils";

type JourneyPillar = { icon: string; label: string };

type HowItWorksHeroFeatureCardsProps = {
  pillars: JourneyPillar[];
  className?: string;
};

export function HowItWorksHeroFeatureCards({ pillars, className }: HowItWorksHeroFeatureCardsProps) {
  const { t } = useTranslation();

  if (pillars.length === 0) return null;

  return (
    <ul
      className={cn("caretip-how-hero-v2__features", className)}
      aria-label={t("staticPages.howItWorks.hero.featuresAria")}
    >
      {pillars.map((pillar, index) => (
        <li
          key={`${pillar.icon}-${pillar.label}`}
          className="caretip-how-hero-v2__feature caretip-how-hero-v2__anim"
          style={{ animationDelay: `${220 + index * 45}ms` } as CSSProperties}
        >
          <JourneyPillarIcon iconKey={pillar.icon} className="caretip-how-hero-v2__feature-icon" />
          <span className="caretip-how-hero-v2__feature-label">{pillar.label}</span>
        </li>
      ))}
    </ul>
  );
}
