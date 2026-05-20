import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { LandingHeroAnimatedWord } from "@/components/landing/LandingHeroAnimatedWord";
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

const heroFloatCardClass =
  "caretip-hero-float-metric__card pointer-events-none absolute z-30 flex items-center rounded-xl border border-neutral-200/70 bg-white ring-1 ring-neutral-950/[0.04] drop-shadow-[0_4px_14px_rgba(15,23,42,0.08),0_16px_40px_-12px_rgba(15,23,42,0.14)] max-lg:bottom-[9%] max-lg:left-auto max-lg:right-[5%] max-lg:max-w-[min(calc(100%-1.5rem),138px)] max-lg:translate-x-0 max-lg:scale-[0.78] max-lg:origin-bottom-right max-lg:gap-1.5 max-lg:px-2 max-lg:py-1.5 sm:max-lg:bottom-[10%] sm:max-lg:right-[6%] sm:max-lg:scale-[0.82] sm:max-lg:max-w-[min(calc(100%-1.75rem),148px)] md:bottom-[11%] md:right-[6%] md:max-w-[min(100%,172px)] md:scale-[0.92] md:gap-2 md:px-2.5 md:py-2 lg:bottom-[11%] lg:right-[7%] lg:max-w-[min(100%,188px)] lg:scale-100 lg:gap-2.5 lg:px-3 lg:py-2.5 lg:rounded-2xl";

const heroFloatCardGlowClass =
  "caretip-hero-float-metric__glow pointer-events-none absolute z-20 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(233,120,28,0.16)_0%,transparent_70%)] blur-sm max-lg:bottom-[12%] max-lg:left-auto max-lg:right-[10%] max-lg:h-9 max-lg:w-16 max-lg:opacity-40 sm:max-lg:bottom-[13%] sm:max-lg:right-[11%] md:bottom-[14%] md:right-[11%] md:h-11 md:w-20 md:opacity-75 lg:bottom-[14%] lg:right-[11%] lg:h-11 lg:w-20 lg:opacity-60";

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
      {metrics.map((metric, index) => (
        <div key={metric.label} className="flex items-center gap-5 sm:gap-6 max-lg:gap-0">
          {index > 0 ? (
            <span className="hidden h-9 w-px shrink-0 bg-neutral-200 sm:block dark:bg-neutral-700" aria-hidden />
          ) : null}
          <div className="max-lg:text-center">
            <strong className="block font-sans text-lg font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-xl lg:text-2xl">
              {metric.value}
            </strong>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400 sm:mt-0.5 sm:text-[11px]">
              {metric.label}
            </span>
          </div>
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
                className={landingUi.heroHeadlineLine}
                variants={reduceMotion ? undefined : landingHeroHeadlineLineReveal}
              >
                {t("landing.showcase.heroTitleLine2Prefix")}
                <LandingHeroAnimatedWord
                  words={heroRotatingWords}
                  className={landingUi.heroHeadlineEmphasis}
                />
                {t("landing.showcase.heroTitleLine2Suffix")}
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
                  ? "max-w-lg max-lg:!mt-5 max-lg:mx-auto md:max-w-[32rem] lg:mx-0 lg:max-w-[38rem] lg:!mt-6 xl:max-w-[39rem]"
                  : "max-w-lg max-lg:!mt-5 max-lg:mx-auto md:max-w-[32rem] lg:mx-0 lg:max-w-[26rem] lg:!mt-6 lg:text-neutral-700 lg:leading-[1.64] lg:[text-wrap:pretty] xl:max-w-[28rem] xl:!mt-6 dark:lg:text-neutral-300",
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
              "max-lg:!mt-5 max-lg:w-full max-lg:pb-0 !mt-6",
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
            "relative z-0 w-full max-lg:mt-2 max-lg:pb-0 sm:max-lg:mt-3 sm:max-lg:pb-1",
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
              "lg:bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.72)_10%,rgba(255,255,255,0.28)_20%,transparent_30%,transparent_70%,rgba(255,255,255,0.28)_80%,rgba(255,255,255,0.72)_90%,#ffffff_100%)]",
            )}
          />

          <motion.div
            className={isDe ? landingUi.heroShowcaseDesktopStageDe : landingUi.heroShowcaseDesktopStageEn}
            initial={
              reduceMotion ? false : isLargeScreen ? { opacity: 0 } : { opacity: 0, scale: 0.99 }
            }
            animate={{ opacity: 1, ...(isLargeScreen ? {} : { scale: 1 }) }}
            transition={{ duration: 0.45, ease: landingHeroEaseOut, delay: 0.1 }}
          >
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

          <div className={cn("caretip-hero-float-metric", landingUi.heroFloatLayer)} aria-hidden>
            <motion.div aria-hidden className={heroFloatCardGlowClass} />
            <motion.div
              className={heroFloatCardClass}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: landingHeroEaseOut }}
            >
              <div className="flex w-full items-center max-lg:gap-1.5 md:gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/12 max-lg:h-5 max-lg:w-5 md:h-7 md:w-7 md:rounded-lg lg:h-8 lg:w-8 lg:rounded-xl">
                  <TrendingUp
                    className="h-3 w-3 text-primary md:h-3.5 md:w-3.5 lg:h-4 lg:w-4"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <strong className="block font-sans text-xs font-semibold tabular-nums tracking-tight text-neutral-900 md:text-sm lg:text-base">
                    {t("landing.showcase.floatCardValue")}
                  </strong>
                  <span className="text-[9px] leading-snug text-neutral-600 md:text-[10px] lg:text-[11px]">
                    {t("landing.showcase.floatCardLabel")}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="relative z-10 pb-10 pt-6 max-lg:px-0 sm:pb-12 sm:pt-7 lg:hidden"
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

