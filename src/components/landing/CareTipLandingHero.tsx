import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
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
  imageAlt: string;
  isDe?: boolean;
  className?: string;
};

/**
 * VaultEdge-inspired split hero ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â adapted for CareTip (Inter, orange, cream panel, product art).
 * Layout reference: vaultedge `index.html` `.ve-hero` + `css/custom-override.css`
 */
export function CareTipLandingHero({ id, imageSrc, imageAlt, isDe = false, className }: CareTipLandingHeroProps) {
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

  const metrics = [
    { value: t("landing.showcase.heroMetric1Value"), label: t("landing.showcase.heroMetric1Label") },
    { value: t("landing.showcase.heroMetric2Value"), label: t("landing.showcase.heroMetric2Label") },
    { value: t("landing.showcase.heroMetric3Value"), label: t("landing.showcase.heroMetric3Label") },
  ];

  const metricsRow = (className?: string) => (
    <motion.div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-4 border-t border-neutral-200/70 pt-6 dark:border-neutral-700/80 sm:gap-x-8 sm:pt-7",
        className,
      )}
      variants={landingHeroTextReveal}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="max-lg:text-center">
          <strong className="block font-sans text-lg font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-xl lg:text-2xl">
            {metric.value}
          </strong>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400 sm:mt-0.5 sm:text-[11px]">
            {metric.label}
          </span>
        </div>
      ))}
    </motion.div>
  );

  return (
    <section
      id={id}
      className={cn(
        "caretip-hero-section relative isolate w-full min-w-0 overflow-x-hidden",
        "scroll-mt-[80px]",
        landingUi.heroSectionCinematic,
        !isDe && "caretip-hero-visual--en",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full min-h-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-8%,rgba(17,17,17,0.03),transparent_58%)] dark:opacity-40"
      />

      <motion.div
        className={cn(
          "relative z-[1] mx-auto flex w-full max-w-[100rem] flex-col px-4 max-lg:gap-y-0 sm:px-6 lg:px-8",
          landingUi.heroSplitRowDesktop,
        )}
        variants={reduceMotion ? undefined : landingHeroCopyStagger}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? false : "visible"}
      >
        {/* Copy ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â mobile: headline + CTAs first; metrics follow the product shot */}
        <motion.div
          className={cn(
            "relative z-10 flex flex-col justify-center pb-0 pt-0 max-lg:px-0 sm:max-lg:pb-1 max-lg:justify-center",
            isDe ? landingUi.heroCopyDesktopDe : landingUi.heroCopyDesktopEn,
          )}
          variants={reduceMotion ? undefined : { hidden: {}, visible: {} }}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? false : "visible"}
        >
          <motion.h1
            className={cn(isDe ? landingUi.heroHeadlineDe : landingUi.heroHeadlineEn, "mt-0 sm:mt-0 lg:mt-0")}
            variants={reduceMotion ? undefined : landingHeroHeadlineStagger}
          >
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
          </motion.h1>

          {landingCopyVisible(heroDescription) ? (
            <motion.p
              className={cn(
                landingUi.heroSubtitle,
                isDe
                  ? "max-w-lg max-lg:!mt-3.5 max-lg:mx-auto md:max-w-[32rem] lg:mx-0 lg:max-w-[38rem] lg:!mt-6 xl:max-w-[39rem]"
                  : "max-w-lg max-lg:!mt-3.5 max-lg:mx-auto md:max-w-[32rem] lg:mx-0 lg:max-w-[26rem] lg:!mt-6 lg:text-neutral-700 lg:leading-[1.64] lg:[text-wrap:pretty] xl:max-w-[28rem] xl:!mt-6 dark:lg:text-neutral-300",
              )}
              variants={reduceMotion ? undefined : landingHeroSubtitleReveal}
            >
              {heroDescription}
            </motion.p>
          ) : null}

          <motion.div
            className={cn(
              landingUi.heroCtaRow,
              "caretip-hero-cta-cluster",
              "max-lg:!mt-4 max-lg:w-full max-lg:pb-0 !mt-6",
              isDe ? "lg:!mt-8" : "lg:!mt-7",
            )}
            variants={reduceMotion ? undefined : landingHeroCtaReveal}
          >
            <Link
              to="/auth?mode=signup&role=business&from=landing"
              className={landingUi.heroCtaPrimary}
            >
              {t("landing.showcase.primaryCta")}
            </Link>
            <Link to="/join" className={landingUi.heroCtaSecondary}>
              <span>{t("landing.showcase.secondaryCta")}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-55" aria-hidden />
            </Link>
          </motion.div>

          {metricsRow(
            isDe
              ? "mt-9 hidden lg:flex sm:mt-10"
              : "mt-9 hidden lg:mt-auto lg:flex lg:border-t-neutral-200/70 lg:pt-9 xl:pt-10 sm:mt-10",
          )}
        </motion.div>

        {/* Product showcase ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â primary focal point on mobile */}
        <motion.div
          className={cn(
            "relative z-0 w-full max-lg:mt-1 max-lg:pb-0 sm:max-lg:mt-1.5 sm:max-lg:pb-0",
            isDe ? landingUi.heroShowcaseColDesktopDe : landingUi.heroShowcaseColDesktopEn,
            isDe ? landingUi.heroShowcaseDesktopColDe : landingUi.heroShowcaseDesktopColEn,
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
            className={cn(
              "caretip-hero-showcase-stage",
              isDe ? landingUi.heroShowcaseDesktopStageDe : landingUi.heroShowcaseDesktopStageEn,
            )}
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
              alt={imageAlt}
              className={cn(
                "relative mx-auto flex w-full justify-center",
                landingUi.heroShowcaseMobileShell,
                isDe ? landingUi.heroShowcaseDesktopShellDe : landingUi.heroShowcaseDesktopShellEn,
              )}
            />
          </motion.div>

          <div className={cn(landingUi.heroFloatLayer)}>
            <LandingHeroFloatingCards />
          </div>
        </motion.div>

        <motion.div
          className="caretip-hero-mobile-metrics relative z-10 pb-10 pt-6 max-lg:px-0 max-lg:pb-8 max-lg:pt-5 sm:pb-12 sm:max-lg:pb-8 sm:max-lg:pt-5 sm:pt-7 lg:hidden"
          variants={landingHeroTextReveal}
        >
          {metricsRow(
            "justify-center border-t-0 pt-0 max-lg:mt-0 max-lg:gap-x-7 max-lg:gap-y-5 sm:max-lg:gap-x-8",
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

