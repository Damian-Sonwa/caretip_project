import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { LiveInMinutesLaptopDemo } from "./LiveInMinutesLaptopDemo";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingType } from "@/components/landing/landingTypography";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingFadeReveal } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

export function SimpleSetupSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const pillSub = t("landing.simpleSetup.pillSub");
  const sectionSubtitle = t("landing.simpleSetup.subtitle");

  const steps = useMemo(
    () =>
      [
        { title: t("landing.simpleSetup.step1Title"), description: t("landing.simpleSetup.step1Desc") },
        { title: t("landing.simpleSetup.step2Title"), description: t("landing.simpleSetup.step2Desc") },
        { title: t("landing.simpleSetup.step3Title"), description: t("landing.simpleSetup.step3Desc") },
        { title: t("landing.simpleSetup.step4Title"), description: t("landing.simpleSetup.step4Desc") },
      ],
    [t],
  );

  return (
    <section
      id="how-it-works"
      className={cn(
        landingUi.section,
        landingUi.landingSurface,
        "relative overflow-hidden max-md:overflow-x-hidden dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#141210_48%,#0a0a0a_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
      />

      <motion.div
        className={cn(
          landingUi.splitGrid,
          landingUi.sectionShell,
          "relative lg:gap-10 xl:gap-14",
        )}
      >
        <div className={cn(landingUi.copyColumn, "lg:order-1 lg:flex lg:flex-col lg:max-w-md xl:max-w-lg")}>
          <motion.div
            {...landingFadeReveal}
            className={cn(landingUi.copyStack, landingUi.mobileStackIntro, "mb-7 max-lg:mb-0 sm:mb-8 lg:mb-7")}
          >
            <div className={cn(landingUi.sectionAccentRow, "max-md:flex-col max-md:items-center")}>
              <LandingSectionAccent variant="spark">{t("landing.simpleSetup.pill")}</LandingSectionAccent>
              {landingCopyVisible(pillSub) ? (
                <LandingSectionAccent variant="arrow" muted>
                  {pillSub}
                </LandingSectionAccent>
              ) : null}
            </div>

            <h2 className={landingUi.headline}>{t("landing.simpleSetup.title")}</h2>
            {landingCopyVisible(sectionSubtitle) ? (
              <p className={cn(landingUi.subtitle, "max-md:max-w-[min(280px,30ch)]")}>{sectionSubtitle}</p>
            ) : null}
          </motion.div>

          <motion.div
            role="list"
            aria-label={t("landing.simpleSetup.stepsAria")}
            className={cn("relative w-full", landingUi.mobileStackAfter)}
            {...landingFadeReveal}
          >
            <div
              aria-hidden
              className="absolute bottom-3 left-[1.125rem] top-3 w-px bg-gradient-to-b from-neutral-300/80 via-neutral-200/60 to-transparent dark:from-neutral-600 dark:via-neutral-700/60 sm:left-5"
            />
            <div className="space-y-2 sm:space-y-2.5">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <motion.button
                    key={step.title}
                    type="button"
                    role="listitem"
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => setActiveStep(idx)}
                    whileHover={reduceMotion ? undefined : { y: isActive ? 0 : -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.995 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "caretip-live-minutes-step group relative w-full rounded-xl border px-3.5 py-3 text-left sm:rounded-2xl sm:px-4 sm:py-4",
                      isActive && "caretip-live-minutes-step--active",
                    )}
                  >
                    <motion.div className="flex items-start gap-3 sm:gap-3.5">
                      <span
                        className={cn(
                          "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-card-title font-bold tabular-nums transition-[background-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-9 sm:w-9",
                          isActive
                            ? "bg-primary text-white shadow-[0_4px_12px_rgba(233,120,28,0.28)]"
                            : "bg-neutral-100/90 text-neutral-600 group-hover:bg-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-300",
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                        <p
                          className={cn(
                            landingType.cardTitle,
                            "tracking-tight",
                            isActive ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-800 dark:text-neutral-100",
                          )}
                        >
                          {step.title}
                        </p>
                        {landingCopyVisible(step.description) ? (
                          <p className={cn(landingType.featureBody, "leading-relaxed")}>{step.description}</p>
                        ) : null}
                      </div>
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          {...landingFadeReveal}
          className={cn(
            landingUi.visualColumn,
            "caretip-live-minutes-visual-wrap lg:order-2 lg:flex lg:items-center lg:justify-center lg:pl-2 lg:pt-0 xl:pl-6",
          )}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <LiveInMinutesLaptopDemo
            videoSrc={import.meta.env.VITE_LIVE_IN_MINUTES_DEMO_VIDEO}
            activeIndex={activeStep}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
