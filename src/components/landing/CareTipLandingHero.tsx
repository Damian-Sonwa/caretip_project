import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingHeroHeadlineWithHighlight } from "@/components/landing/landingHeroHeadline";
import { LandingHeroAnimatedWord } from "@/components/landing/LandingHeroAnimatedWord";
import { LandingHeroFloatingCards } from "@/components/landing/LandingHeroFloatingCards";
import { LandingHeroShowcase } from "@/components/landing/LandingHeroShowcase";
import {
  landingHeroCopyStagger,
  landingHeroCtaReveal,
  landingHeroEaseOut,
  landingHeroHeadlineLineReveal,
  landingHeroHeadlineStagger,
  landingHeroSubtitleReveal,
  landingHeroTextReveal,
} from "@/components/landing/landingHeroMotion";
import { useLargeScreen } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

export type CareTipLandingHeroProps = {
  id?: string;
  imageSrc: string;
  imageWebpSrc?: string;
  imageAlt: string;
  /** Selects hero art asset only (not copy layout). */
  isDe?: boolean;
  className?: string;
};

export function CareTipLandingHero({
  id,
  imageSrc,
  imageWebpSrc,
  imageAlt,
  isDe = false,
  className,
}: CareTipLandingHeroProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isLargeScreen = useLargeScreen();

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

      <motion.div
        className={cn(
          "caretip-hero-grid caretip-hero-split relative z-[1] mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8",
          landingUi.heroSplitRowDesktop,
        )}
        variants={reduceMotion ? undefined : landingHeroCopyStagger}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? false : "visible"}
      >
        <motion.div
          className={cn(
            "caretip-hero-grid__message caretip-hero-copy caretip-hero-copy-block",
            landingUi.heroCopyDesktop,
          )}
          variants={reduceMotion ? undefined : { hidden: {}, visible: {} }}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? false : "visible"}
        >
          <motion.h1
            className={cn(landingUi.heroHeadline, "mt-0")}
            data-hero-headline-mode={headlineMode}
            variants={reduceMotion ? undefined : landingHeroHeadlineStagger}
          >
            {useStaticHeadline ? (
              <motion.span
                className={cn(landingUi.heroHeadlineLine, "caretip-hero-headline-line--static")}
                variants={reduceMotion ? undefined : landingHeroHeadlineLineReveal}
              >
                {landingHeroHeadlineWithHighlight(
                  heroHeadline,
                  heroHeadlineHighlight,
                  landingUi.heroHeadlineEmphasis,
                )}
              </motion.span>
            ) : (
              <>
                <motion.span
                  className={landingUi.heroHeadlineLine}
                  variants={reduceMotion ? undefined : landingHeroHeadlineLineReveal}
                >
                  {t("landing.showcase.heroTitlePrefix")}
                  {t("landing.showcase.heroTitleEmphasis") ? (
                    <span className={landingUi.heroHeadlineEmphasis}>{t("landing.showcase.heroTitleEmphasis")}</span>
                  ) : null}
                  {t("landing.showcase.heroTitleSuffix")}
                </motion.span>
                {heroRotatingWords.length > 0 || t("landing.showcase.heroTitleLine2Emphasis") ? (
                  <motion.span
                    className={cn(landingUi.heroHeadlineLine, "caretip-hero-headline-line--rotating")}
                    variants={reduceMotion ? undefined : landingHeroHeadlineLineReveal}
                  >
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
                  </motion.span>
                ) : t("landing.showcase.heroTitleLine2") ? (
                  <motion.span
                    className={landingUi.heroHeadlineLine}
                    variants={reduceMotion ? undefined : landingHeroHeadlineLineReveal}
                  >
                    {t("landing.showcase.heroTitleLine2")}
                  </motion.span>
                ) : null}
                {t("landing.showcase.heroTitleLine3") ? (
                  <motion.span
                    className={landingUi.heroHeadlineLine}
                    variants={reduceMotion ? undefined : landingHeroHeadlineLineReveal}
                  >
                    {t("landing.showcase.heroTitleLine3")}
                  </motion.span>
                ) : null}
              </>
            )}
          </motion.h1>

          {landingCopyVisible(heroDescription) ? (
            <motion.p
              className={cn(landingUi.heroSubtitle, "caretip-hero-subtitle")}
              variants={reduceMotion ? undefined : landingHeroSubtitleReveal}
            >
              {heroDescription}
            </motion.p>
          ) : null}

          <motion.div
            className={cn(landingUi.heroCtaRow, "caretip-hero-cta-cluster")}
            variants={reduceMotion ? undefined : landingHeroCtaReveal}
          >
            <Link
              to="/auth?mode=signup&role=business&from=landing"
              className={landingUi.heroCtaPrimary}
            >
              {t("landing.showcase.primaryCta")}
            </Link>
            <Link to="/join" className={landingUi.heroCtaSecondary}>
              {t("landing.showcase.secondaryCta")}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className={cn(
            "caretip-hero-grid__showcase caretip-hero-showcase-col",
            landingUi.heroShowcaseColDesktop,
          )}
          variants={landingHeroTextReveal}
        >
          <div
            aria-hidden
            className={cn(
              "caretip-hero-showcase-radial pointer-events-none absolute inset-0",
              "max-lg:bg-[linear-gradient(105deg,#ffffff_0%,#ffffff_14%,rgba(255,255,255,0.98)_24%,rgba(255,255,255,0.88)_36%,rgba(255,255,255,0.45)_50%,transparent_62%)]",
              "lg:bg-transparent",
            )}
          />

          <motion.div
            className={cn("caretip-hero-showcase-stage", landingUi.heroShowcaseDesktopStage)}
            initial={
              reduceMotion ? false : isLargeScreen ? { opacity: 0 } : { opacity: 0, scale: 0.99 }
            }
            animate={{ opacity: 1, ...(isLargeScreen ? {} : { scale: 1 }) }}
            transition={{ duration: 0.45, ease: landingHeroEaseOut, delay: 0.1 }}
          >
            <div
              aria-hidden
              className="caretip-hero-warm-ambience pointer-events-none absolute inset-0 z-0"
            />
            <LandingHeroShowcase
              src={imageSrc}
              webpSrc={imageWebpSrc}
              alt={imageAlt}
              className={cn(
                "relative z-[1] mx-auto flex w-full justify-center",
                landingUi.heroShowcaseMobileShell,
                landingUi.heroShowcaseDesktopShell,
              )}
            />
            <div className={cn(landingUi.heroFloatLayer)}>
              <LandingHeroFloatingCards />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
