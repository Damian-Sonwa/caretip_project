import { ShieldCheck, Smartphone, Sparkles, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Must stay aligned with `PublicTrustChips` features variant keys (excluding panel title). */
const QUICK_START_ITEM_KEYS = [
  "noApp",
  "instantPayouts",
  "secureOnboarding",
  "worksInstantly",
] as const;

const QUICK_START_ICONS = {
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
    <div
      className={cn("caretip-features-hero-v2__quick-start", className)}
      style={style}
      aria-labelledby="features-hero-quick-start-title"
    >
      <h2 id="features-hero-quick-start-title" className="caretip-features-hero-v2__quick-start-title">
        {t(`${ns}.liveMinutes`)}
      </h2>
      <ul className="caretip-features-hero-v2__quick-start-list" aria-label={t("staticPages.common.trustChipsAria")}>
        {QUICK_START_ITEM_KEYS.map((key) => {
          const Icon = QUICK_START_ICONS[key];
          return (
            <li key={key} className="caretip-features-hero-v2__quick-start-item">
              <span className="caretip-features-hero-v2__quick-start-icon" aria-hidden>
                <Icon className="size-[1.0625rem]" strokeWidth={2.1} />
              </span>
              <span className="caretip-features-hero-v2__quick-start-label">{t(`${ns}.${key}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
