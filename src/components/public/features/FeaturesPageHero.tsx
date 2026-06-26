import { useTranslation } from "react-i18next";
import { PublicPageBackLink } from "@/components/public/PublicPageBackLink";
import { FeaturesHeroTrustChips } from "@/components/public/features/FeaturesHeroTrustChips";
import { FeaturesPageHeroVisual } from "@/components/public/features/FeaturesPageHeroVisual";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

export function FeaturesPageHero() {
  usePublicMountProbe("FeaturesPageHero");
  const { t } = useTranslation();

  return (
    <header className={cn(publicPageUi.header, "caretip-features-hero-v2 relative mb-3 sm:mb-5")}>
      <PublicPageBackLink className="caretip-features-hero-v2__back relative z-[2]" />

      <div className="caretip-features-hero-v2__shell">
        <div className="caretip-features-hero-v2__backdrop" aria-hidden />
        <div className="caretip-features-hero-v2__glow" aria-hidden />

        <div className="caretip-features-hero-v2__grid">
          <div className="caretip-features-hero-v2__content">
            <h1
              id="features-hero-title"
              className={cn(
                publicPageUi.title,
                "caretip-features-hero-v2__title caretip-features-hero-v2__anim",
              )}
            >
              {t("staticPages.features.title")}
            </h1>

            <div className="caretip-features-hero-v2__copy">
              <p
                className={cn(
                  publicPageUi.subtitle,
                  "caretip-features-hero-v2__lead caretip-features-hero-v2__anim",
                )}
                style={{ animationDelay: "45ms" }}
              >
                {t("staticPages.features.subtitleLead")}
              </p>
              <p
                className={cn(
                  publicPageUi.subtitle,
                  "caretip-features-hero-v2__body caretip-features-hero-v2__anim",
                )}
                style={{ animationDelay: "80ms" }}
              >
                {t("staticPages.features.subtitleBody")}
              </p>
            </div>

            <FeaturesHeroTrustChips className="caretip-features-hero-v2__anim" style={{ animationDelay: "130ms" }} />
          </div>

          <FeaturesPageHeroVisual />
        </div>
      </div>
    </header>
  );
}
