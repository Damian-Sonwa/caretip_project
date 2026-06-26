import { ShieldCheck, Smartphone, Sparkles, TrendingUp, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Must stay aligned with `PublicTrustChips` features variant keys. */
const TRUST_KEYS = ["liveMinutes", "noApp", "instantPayouts", "secureOnboarding", "worksInstantly"] as const;

const TRUST_ICONS = {
  liveMinutes: Zap,
  noApp: Smartphone,
  instantPayouts: TrendingUp,
  secureOnboarding: ShieldCheck,
  worksInstantly: Sparkles,
} as const;

type FeaturesHeroTrustChipsProps = {
  className?: string;
  style?: CSSProperties;
};

export function FeaturesHeroTrustChips({ className, style }: FeaturesHeroTrustChipsProps) {
  const { t } = useTranslation();
  const ns = "staticPages.common.trustChipsFeatures";

  return (
    <ul
      className={cn("caretip-features-hero-v2__chips", className)}
      style={style}
      aria-label={t("staticPages.common.trustChipsAria")}
    >
      {TRUST_KEYS.map((key, index) => {
        const Icon = TRUST_ICONS[key];
        return (
          <li
            key={key}
            className="caretip-features-hero-v2__chip caretip-features-hero-v2__anim"
            style={{ animationDelay: `${180 + index * 50}ms` }}
          >
            <span className="caretip-features-hero-v2__chip-icon" aria-hidden>
              <Icon className="size-[1.0625rem]" strokeWidth={2.1} />
            </span>
            <span className="caretip-features-hero-v2__chip-label">{t(`${ns}.${key}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}
