import { Link } from "react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingHeroHeadlineWithHighlight } from "@/components/landing/landingHeroHeadline";
import { LandingHeroAnimatedWord } from "@/components/landing/LandingHeroAnimatedWord";
import { LandingHeroStoryShowcase } from "@/components/landing/LandingHeroStoryShowcase";
import { LandingCopySentences } from "@/components/landing/LandingCopySentences";
import { cn } from "@/lib/utils";

export type CareTipLandingHeroProps = {
  id?: string;
  imageAlt: string;
  /** Locale marker for hero shell styling. */
  isDe?: boolean;
  className?: string;
};

/** Hero copy + showcase — plain HTML for instant first paint (no Framer Motion). */
export function CareTipLandingHero({
  id,
  imageAlt,
  isDe = false,
  className,
}: CareTipLandingHeroProps) {
  const { t, i18n } = useTranslation();

  const heroRotatingWords = useMemo(() => {
    const raw = t("landing.showcase.heroRotatingWords", { returnObjects: true });
    if (Array.isArray(raw) && raw.every((w) => typeof w === "string")) {
      return raw as string[];
    }
    const fallback = t("landing.showcase.heroTitleLine2Emphasis");
    return fallback ? [fallback] : [];
  }, [t, i18n.language]);

  const heroDescription = t("landing.showcase.description");
  const heroHeadline = t("landing.showcase.heroHeadline");
  const heroHeadlineHighlight = t("landing.showcase.heroHeadlineHighlight");
  const useStaticHeadline = landingCopyVisible(heroHeadline);
  const headlineMode = useStaticHeadline ? "static" : "composed";

  return (
    <section
      id={id}
      data-hero-art={isDe ? "de" : "en"}
      className={cn(
        "caretip-hero-section relative isolate w-full min-w-0 overflow-x-hidden",
        "scroll-mt-[80px]",
        landingUi.heroSectionCinematic,
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full min-h-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-8%,rgba(17,17,17,0.03),transparent_58%)] dark:opacity-40"
      />

      <div
        className={cn(
          "caretip-hero-grid caretip-hero-split relative z-[1] mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8",
          landingUi.heroSplitRowDesktop,
        )}
      >
        <div
          className={cn(
            "caretip-hero-grid__message caretip-hero-copy caretip-hero-copy-block",
            landingUi.heroCopyDesktop,
          )}
        >
          <h1
            className={cn(landingUi.heroHeadline, "mt-0")}
            data-hero-headline-mode={headlineMode}
          >
            {useStaticHeadline ? (
              <span className={cn(landingUi.heroHeadlineLine, "caretip-hero-headline-line--static")}>
                {landingHeroHeadlineWithHighlight(
                  heroHeadline,
                  heroHeadlineHighlight,
                  landingUi.heroHeadlineEmphasis,
                )}
              </span>
            ) : (
              <>
                <span className={landingUi.heroHeadlineLine}>
                  {t("landing.showcase.heroTitlePrefix")}
                  {t("landing.showcase.heroTitleEmphasis") ? (
                    <span className={landingUi.heroHeadlineEmphasis}>{t("landing.showcase.heroTitleEmphasis")}</span>
                  ) : null}
                  {t("landing.showcase.heroTitleSuffix")}
                </span>
                {heroRotatingWords.length > 0 || t("landing.showcase.heroTitleLine2Emphasis") ? (
                  <span className={cn(landingUi.heroHeadlineLine, "caretip-hero-headline-line--rotating")}>
                    <span className="caretip-hero-headline-rotating-stack">
                      {t("landing.showcase.heroTitleLine2Prefix") ? (
                        <span className="caretip-hero-headline-rotating-prefix">
                          {t("landing.showcase.heroTitleLine2Prefix")}
                        </span>
                      ) : null}
                      <span className="caretip-hero-headline-rotating-emphasis-line">
                        <LandingHeroAnimatedWord
                          words={heroRotatingWords}
                          className={landingUi.heroHeadlineEmphasis}
                        />
                      </span>
                      {t("landing.showcase.heroTitleLine2Suffix") ? (
                        <span className="caretip-hero-headline-rotating-suffix">
                          {t("landing.showcase.heroTitleLine2Suffix")}
                        </span>
                      ) : null}
                    </span>
                  </span>
                ) : t("landing.showcase.heroTitleLine2") ? (
                  <span className={landingUi.heroHeadlineLine}>{t("landing.showcase.heroTitleLine2")}</span>
                ) : null}
                {t("landing.showcase.heroTitleLine3") ? (
                  <span className={landingUi.heroHeadlineLine}>{t("landing.showcase.heroTitleLine3")}</span>
                ) : null}
              </>
            )}
          </h1>

          {landingCopyVisible(heroDescription) ? (
            <LandingCopySentences
              text={heroDescription}
              layout="paragraphs"
              className={cn(landingUi.heroSubtitle, "caretip-hero-subtitle")}
              sentenceClassName={cn(landingUi.heroSubtitle, "caretip-hero-subtitle m-0")}
            />
          ) : null}

          <div className={cn(landingUi.heroCtaRow, "caretip-hero-cta-cluster")}>
            <div className={landingUi.heroCtaUnit}>
              <Link
                to="/signup"
                className={landingUi.heroCtaPrimary}
                aria-label={t("landing.showcase.primaryCta")}
              >
                {t("landing.showcase.primaryCta")}
              </Link>
            </div>
            <div className={landingUi.heroCtaUnit}>
              <Link
                to="/join"
                className={landingUi.heroCtaSecondary}
                aria-label={t("landing.showcase.secondaryCta")}
              >
                {t("landing.showcase.secondaryCta")}
              </Link>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "caretip-hero-grid__showcase caretip-hero-showcase-col",
            landingUi.heroShowcaseColDesktop,
          )}
        >
          <div
            aria-hidden
            className={cn(
              "caretip-hero-showcase-radial pointer-events-none absolute inset-0",
              "max-lg:bg-[linear-gradient(105deg,#ffffff_0%,#ffffff_14%,rgba(255,255,255,0.98)_24%,rgba(255,255,255,0.88)_36%,rgba(255,255,255,0.45)_50%,transparent_62%)]",
              "lg:bg-transparent",
            )}
          />

          <div className={cn("caretip-hero-showcase-stage", landingUi.heroShowcaseDesktopStage)}>
            <div
              aria-hidden
              className="caretip-hero-warm-ambience pointer-events-none absolute inset-0 z-0"
            />
            <LandingHeroStoryShowcase
              alt={imageAlt}
              className={cn(
                "relative z-[1] mx-auto flex w-full justify-center",
                landingUi.heroShowcaseMobileShell,
                landingUi.heroShowcaseDesktopShell,
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
