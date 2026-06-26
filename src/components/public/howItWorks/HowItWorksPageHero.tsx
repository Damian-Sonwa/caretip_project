import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicPageBackLink } from "@/components/public/PublicPageBackLink";
import { HowItWorksHeroTrustRow } from "@/components/public/howItWorks/HowItWorksHeroTrustRow";
import { HowItWorksHeroVisual } from "@/components/public/howItWorks/HowItWorksHeroVisual";
import { publicPagesBrandUi } from "@/components/public/publicPagesBrandUi";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

type HowItWorksPageHeroProps = {
  className?: string;
};

export function HowItWorksPageHero({ className }: HowItWorksPageHeroProps) {
  const { t } = useTranslation();

  return (
    <section className={cn("caretip-how-hero-v2", className)} aria-labelledby="how-it-works-hero-title">
      <PublicPageBackLink className="caretip-how-hero-v2__back relative z-[2]" />

      <div className="caretip-how-hero-v2__shell">
        <div className="caretip-how-hero-v2__backdrop" aria-hidden />
        <div className="caretip-how-hero-v2__glow" aria-hidden />

        <div className="caretip-how-hero-v2__grid">
          <div className="caretip-how-hero-v2__content">
            <div className="caretip-how-hero-v2__badge caretip-how-hero-v2__anim">
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              <span>{t("staticPages.howItWorks.hero.badge")}</span>
            </div>

            <h1
              id="how-it-works-hero-title"
              className={cn(publicPageUi.title, "caretip-how-hero-v2__title caretip-how-hero-v2__anim")}
              style={{ animationDelay: "45ms" }}
            >
              {t("staticPages.howItWorks.title")}
            </h1>

            <p
              className={cn(publicPageUi.subtitle, "caretip-how-hero-v2__subtitle caretip-how-hero-v2__anim")}
              style={{ animationDelay: "80ms" }}
            >
              {t("staticPages.howItWorks.subtitle")}
            </p>

            <div
              className="caretip-how-hero-v2__actions caretip-how-hero-v2__anim"
              style={{ animationDelay: "120ms" }}
            >
              <Link to="/signup" className={publicPagesBrandUi.ctaButtonPrimary}>
                {t("staticPages.howItWorks.hero.getStarted")}
              </Link>
              <Link to="/pricing" className={publicPagesBrandUi.ctaButtonSecondary}>
                {t("staticPages.howItWorks.ctaPricing")}
              </Link>
            </div>

            <HowItWorksHeroTrustRow
              className="caretip-how-hero-v2__anim"
              style={{ animationDelay: "155ms" }}
            />
          </div>

          <HowItWorksHeroVisual />
        </div>
      </div>
    </section>
  );
}
