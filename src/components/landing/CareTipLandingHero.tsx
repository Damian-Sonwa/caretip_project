import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { landingUi } from "@/components/landing/landingUi";
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

const floatCardMotion = {
  y: [0, -3, 0],
  x: [0, 1, -1, 0],
};

/** Tertiary accent on product art — smaller/softer on mobile so the phone stays primary. */
const heroFloatCardClass =
  "pointer-events-none absolute z-20 flex items-center rounded-xl border border-neutral-200/60 bg-white/[0.97] ring-1 ring-neutral-950/[0.03] max-lg:bottom-[6%] max-lg:left-auto max-lg:right-0 max-lg:max-w-[min(calc(100%-1rem),138px)] max-lg:translate-x-0 max-lg:scale-[0.78] max-lg:origin-bottom-right max-lg:gap-1.5 max-lg:px-2 max-lg:py-1.5 max-lg:shadow-[0_2px_6px_rgba(15,23,42,0.04),0_8px_22px_-8px_rgba(15,23,42,0.09)] sm:max-lg:bottom-[7%] sm:max-lg:right-[1%] sm:max-lg:scale-[0.82] sm:max-lg:max-w-[min(calc(100%-1.25rem),148px)] md:bottom-[12%] md:right-[0%] md:max-w-[min(100%,172px)] md:scale-[0.92] md:gap-2 md:px-2.5 md:py-2 md:shadow-[0_2px_5px_rgba(15,23,42,0.04),0_12px_32px_-10px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] lg:bottom-[14%] lg:right-[2%] lg:max-w-[min(100%,188px)] lg:scale-100 lg:gap-2.5 lg:px-3 lg:py-2.5 lg:rounded-2xl lg:z-30";

const heroFloatCardGlowClass =
  "pointer-events-none absolute z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(235,153,44,0.18)_0%,transparent_70%)] blur-lg max-lg:blur-md max-lg:bottom-[14%] max-lg:left-auto max-lg:right-[6%] max-lg:h-9 max-lg:w-16 max-lg:translate-x-0 max-lg:opacity-45 sm:max-lg:bottom-[15%] sm:max-lg:right-[8%] md:bottom-[20%] md:right-[10%] md:h-12 md:w-20 md:opacity-90 lg:h-14 lg:w-24";

export type CareTipLandingHeroProps = {
  id?: string;
  imageSrc: string;
  imageAlt: string;
  isDe?: boolean;
  className?: string;
};

/**
 * VaultEdge-inspired split hero — adapted for CareTip (Inter, orange, cream panel, product art).
 * Layout reference: vaultedge `index.html` `.ve-hero` + `css/custom-override.css`
 */
export function CareTipLandingHero({ id, imageSrc, imageAlt, isDe = false, className }: CareTipLandingHeroProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isLargeScreen = useLargeScreen();
  const floatCardLoop = !reduceMotion && isLargeScreen;

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
        "relative isolate w-full min-w-0 overflow-x-hidden",
        "scroll-mt-[80px] bg-[linear-gradient(180deg,#fafaf8_0%,#ffffff_42%,#f7f6f4_100%)]",
        landingUi.heroSectionCinematic,
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 min-h-[min(84vh,880px)] bg-[radial-gradient(ellipse_150%_68%_at_50%_-10%,rgba(235,153,44,0.065),transparent_62%),radial-gradient(ellipse_100%_58%_at_0%_40%,rgba(120,113,105,0.042),transparent_58%)] dark:opacity-40"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-[1] mx-auto flex w-full max-w-[100rem] flex-col max-lg:gap-y-0 lg:flex-row lg:min-h-[min(84vh,800px)] lg:items-center lg:gap-2 xl:gap-4"
        variants={reduceMotion ? undefined : landingHeroCopyStagger}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? false : "visible"}
      >
        {/* Copy — mobile: headline + CTAs first; metrics follow the product shot */}
        <motion.div
          className="relative z-10 flex flex-col justify-center px-5 pb-4 pt-1 sm:px-8 sm:pb-5 lg:w-[min(100%,54%)] lg:flex-none lg:px-12 lg:pb-16 lg:pt-6 xl:px-16"
          variants={reduceMotion ? undefined : { hidden: {}, visible: {} }}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? false : "visible"}
        >
          <motion.h1
            className={cn(
              isDe ? landingUi.heroHeadlineDe : landingUi.heroHeadlineEn,
              "mt-0 max-lg:max-w-[24ch] sm:mt-0 lg:mt-0",
            )}
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
            {t("landing.showcase.heroTitleLine2Emphasis") ? (
              <motion.span className={landingUi.heroHeadlineLine} variants={landingHeroHeadlineLineReveal}>
                {t("landing.showcase.heroTitleLine2Prefix")}
                <span className={landingUi.heroHeadlineEmphasis}>{t("landing.showcase.heroTitleLine2Emphasis")}</span>
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

          <motion.p
            className={cn(landingUi.heroSubtitle, "max-w-lg max-lg:!mt-5 md:max-w-[32rem] lg:!mt-6")}
            variants={reduceMotion ? undefined : landingHeroSubtitleReveal}
          >
            {t("landing.showcase.description")}
          </motion.p>

          <motion.div
            className={cn(landingUi.heroCtaRow, "!mt-6 max-lg:pb-0 lg:!mt-8")}
            variants={reduceMotion ? undefined : landingHeroCtaReveal}
          >
            <Link to="/auth?mode=signup&role=business&from=landing" className={landingUi.heroCtaPrimary}>
              {t("landing.showcase.primaryCta")}
            </Link>
            <Link to="/join" className={landingUi.heroCtaSecondary}>
              <span>{t("landing.showcase.secondaryCta")}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-55" aria-hidden />
            </Link>
          </motion.div>

          {metricsRow("mt-9 hidden lg:flex sm:mt-10")}
        </motion.div>

        {/* Product showcase — primary focal point on mobile */}
        <motion.div
          className="relative w-full max-lg:mt-8 max-lg:min-h-[min(74vw,500px)] sm:max-lg:mt-10 sm:max-lg:min-h-[min(70vw,520px)] lg:mt-0 lg:min-h-0 lg:w-[46%] lg:flex-1 lg:self-stretch"
          variants={landingHeroTextReveal}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,#fafaf8_0%,#fafaf8_12%,rgba(250,249,247,0.85)_28%,rgba(250,249,247,0.35)_48%,transparent_62%)] lg:via-[#fafaf8]/20"
          />

          <motion.div
            className="absolute inset-0 flex items-center justify-center max-lg:px-5 max-lg:pt-10 max-lg:pb-8 sm:max-lg:px-7 sm:max-lg:pt-11 sm:max-lg:pb-9 lg:px-8 lg:py-10"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: landingHeroEaseOut, delay: 0.1 }}
          >
            <LandingHeroShowcase
              src={imageSrc}
              alt={imageAlt}
              className={cn(
                "relative mx-auto flex w-full max-w-[min(100%,22rem)] justify-center sm:max-w-[min(100%,26rem)] lg:max-w-[min(100%,40rem)]",
                landingUi.heroShowcaseMobileShell,
              )}
              compositionOverlay={
                <>
                  <motion.div
                    aria-hidden
                    className={heroFloatCardGlowClass}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                  <motion.div
                    className={heroFloatCardClass}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: landingHeroEaseOut }}
                  >
                    <motion.div
                      className="flex w-full items-center max-lg:gap-1.5 md:gap-2"
                      animate={floatCardLoop ? floatCardMotion : undefined}
                      transition={
                        floatCardLoop
                          ? { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
                          : undefined
                      }
                    >
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
                    </motion.div>
                  </motion.div>
                </>
              }
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="px-5 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-7 lg:hidden"
          variants={landingHeroTextReveal}
        >
          {metricsRow(
            "justify-center border-t-0 pt-0 max-lg:mt-1 max-lg:gap-x-7 max-lg:gap-y-5 sm:max-lg:gap-x-8",
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
