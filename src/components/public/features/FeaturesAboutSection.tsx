import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingCopyVisible } from "@/components/landing/landingUi";
import { publicPageUi } from "@/components/public/publicPageUi";
import { publicPagesBrandUi } from "@/components/public/publicPagesBrandUi";
import { cn } from "@/lib/utils";
import { usePublicScrollReveal } from "@/lib/usePublicScrollReveal";

export function FeaturesAboutSection() {
  const { t } = useTranslation();
  const headerReveal = usePublicScrollReveal<HTMLDivElement>(0);
  const bodyReveal = usePublicScrollReveal<HTMLDivElement>(0.06);

  return (
    <section className="caretip-features-about mt-10 pb-4 sm:mt-12 sm:pb-6" aria-labelledby="features-about-title">
      <div
        ref={headerReveal.ref}
        style={headerReveal.style}
        className={cn(headerReveal.className, "caretip-features-about__header mx-auto max-w-3xl text-center")}
      >
        <div className="mb-4 flex justify-center">
          <LandingSectionAccent variant="line" muted>
            {t("staticPages.features.about.eyebrow")}
          </LandingSectionAccent>
        </div>
        <h2 id="features-about-title" className={publicPageUi.marketingSectionTitle}>
          {t("staticPages.features.about.title")}
        </h2>
        <p className={cn(publicPageUi.marketingSectionSubtitle, "mx-auto mt-4 max-w-2xl")}>
          {t("staticPages.features.about.intro")}
        </p>
      </div>

      <div
        ref={bodyReveal.ref}
        style={bodyReveal.style}
        className={cn(
          bodyReveal.className,
          "caretip-features-about__body mx-auto mt-8 max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground sm:mt-10 sm:text-[0.9375rem]",
        )}
      >
        <p>{t("staticPages.features.about.origin")}</p>

        <div className="space-y-4">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {t("staticPages.features.about.visionTitle")}
          </h3>
          <p>{t("staticPages.features.about.visionP1")}</p>
          <p>{t("staticPages.features.about.visionP2")}</p>
        </div>

        <blockquote className="caretip-features-about__quote border-l-2 border-primary/50 pl-4 italic text-foreground/90">
          <p>{t("staticPages.features.about.quote")}</p>
          <footer className="mt-3 not-italic text-xs font-medium text-muted-foreground">
            {t("staticPages.features.about.quoteAttribution")}
          </footer>
        </blockquote>

        <div className="space-y-4">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {t("staticPages.features.about.driveTitle")}
          </h3>
          <p>{t("staticPages.features.about.driveBody")}</p>
          <p className="font-medium text-foreground">{t("staticPages.features.about.driveClosing")}</p>
        </div>
      </div>

      <div className={cn("mx-auto mt-10 max-w-3xl sm:mt-12", publicPagesBrandUi.warmDarkCta)}>
        <h3 className={publicPagesBrandUi.warmDarkCtaTitle}>{t("staticPages.features.ctaTitle")}</h3>
        {landingCopyVisible(t("staticPages.features.ctaBody")) ? (
          <p className={publicPagesBrandUi.warmDarkCtaBody}>{t("staticPages.features.ctaBody")}</p>
        ) : null}
        <div className={publicPagesBrandUi.warmDarkCtaActions}>
          <Link to="/signup" className={publicPagesBrandUi.ctaButtonPrimary}>
            {t("staticPages.features.ctaPrimary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
