import { Lock, Shield, Smartphone, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  HOW_IT_WORKS_HERO_TRUST_KEYS,
  type HowItWorksHeroTrustKey,
} from "@/components/public/howItWorks/howItWorksHeroConfig";
import { cn } from "@/lib/utils";

const TRUST_ICONS: Record<HowItWorksHeroTrustKey, typeof Shield> = {
  noApp: Smartphone,
  stripe: Shield,
  liveMinutes: Zap,
  gdpr: Lock,
};

type HowItWorksHeroTrustRowProps = {
  className?: string;
  style?: CSSProperties;
};

export function HowItWorksHeroTrustRow({ className, style }: HowItWorksHeroTrustRowProps) {
  const { t } = useTranslation();
  const ns = "staticPages.howItWorks.hero.trustRow";

  return (
    <ul
      className={cn("caretip-how-hero-v2__trust", className)}
      style={style}
      aria-label={t(`${ns}.aria`)}
    >
      {HOW_IT_WORKS_HERO_TRUST_KEYS.map((key) => {
        const Icon = TRUST_ICONS[key];
        return (
          <li key={key} className="caretip-how-hero-v2__trust-item">
            <Icon className="size-3.5 shrink-0 text-primary" strokeWidth={2.2} aria-hidden />
            <span>{t(`${ns}.${key}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}
