import { useEffect, useMemo, useRef, useState } from "react";
import { dispatchLandingIntent } from "../../lib/landingAiIntent";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { LiveInMinutesLaptopDemo } from "./LiveInMinutesLaptopDemo";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingType } from "@/components/landing/landingTypography";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingFadeReveal, landingFadeRevealWithDelay, useMinWidthMedia } from "@/lib/motionPerf";
import {
  landingRevealTransition,
  landingScrollRevealProps,
  landingStaggerDelay,
} from "@/lib/landingMotion";
import { cn } from "@/lib/utils";

function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function SimpleSetupSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const isLgUp = useMinWidthMedia(1024);
  const [activeStep, setActiveStep] = useState(0);
  const onboardingIntentSent = useRef(false);

  useEffect(() => {
    if (activeStep > 0 && !onboardingIntentSent.current) {
      onboardingIntentSent.current = true;
      dispatchLandingIntent("onboarding_attempt");
    }
  }, [activeStep]);

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
        "caretip-live-minutes-section relative overflow-x-clip dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#141210_48%,#0a0a0a_100%)]",
      )}
    >
      <motion.div
        className={cn(
          landingUi.splitGrid,
          landingUi.sectionShell,
          "caretip-live-minutes-split relative",
        )}
      >
        <div className={cn(landingUi.copyColumn, "caretip-live-minutes-copy lg:order-1")}>
          <motion.div
            {...landingFadeReveal}
            className={cn(landingUi.copyStack, landingUi.mobileStackIntro, "caretip-live-minutes-intro")}
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
          >
            <div className="caretip-process-steps relative flex flex-col gap-6 sm:gap-8 lg:gap-9">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <motion.button
                    key={step.title}
                    type="button"
                    role="listitem"
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => setActiveStep(idx)}
                    {...landingScrollRevealProps(reduceMotion, {
                      delay: landingStaggerDelay(idx),
                      isMobile: !isLgUp,
                    })}
                    className={cn(
                      "caretip-process-step group relative w-full text-left",
                      isActive && "caretip-process-step--active",
                    )}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <span
                        className="caretip-process-step-number shrink-0 font-hero-display text-[2.75rem] font-extrabold leading-none tracking-tight tabular-nums sm:text-[3.25rem]"
                        aria-hidden
                      >
                        {formatStepNumber(idx)}
                      </span>
                      <div className="caretip-process-step-body min-w-0 flex-1 pt-1 sm:pt-1.5">
                        <p
                          className={cn(
                            landingType.cardTitle,
                            "caretip-process-step-title tracking-tight",
                            isActive
                              ? "caretip-process-step-title--active"
                              : "caretip-process-step-title--inactive",
                          )}
                        >
                          {step.title}
                        </p>
                        {landingCopyVisible(step.description) ? (
                          <p
                            className={cn(
                              landingUi.cardFeatureBody,
                              "caretip-process-step-desc max-w-prose",
                              isActive
                                ? "caretip-process-step-desc--active"
                                : "caretip-process-step-desc--inactive",
                            )}
                          >
                            {step.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
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
            "caretip-live-minutes-visual-wrap lg:order-2 lg:flex lg:items-center lg:justify-start lg:pt-0",
          )}
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
