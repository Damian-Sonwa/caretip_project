import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LiveInMinutesLaptopDemo } from "./LiveInMinutesLaptopDemo";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

export function SimpleSetupSection() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

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

  const handleDemoIndexChange = useCallback((index: number) => {
    setActiveStep(index);
  }, []);

  return (
    <section
      id="how-it-works"
      className={cn(
        landingUi.section,
        "relative overflow-hidden max-md:overflow-x-hidden",
        "border-y border-neutral-200/60 dark:border-neutral-800/80",
        "bg-[linear-gradient(180deg,#ffffff_0%,#f6f4f1_38%,#ffffff_100%)]",
        "dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#121110_45%,#0a0a0a_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_75%_40%,rgba(235,153,44,0.06),transparent_60%)]"
      />

      <div className={cn(landingUi.splitGrid, "relative lg:items-start lg:gap-14")}>
        <div className={cn(landingUi.copyColumn, "lg:order-1 lg:max-w-xl")}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className={cn(landingUi.copyStack, "mb-7 sm:mb-8")}
          >
            <div className={landingUi.pillRow}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 sm:gap-2 sm:px-3 sm:py-1 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                {t("landing.simpleSetup.pill")}
              </span>
              <span className="text-center text-[13px] font-medium text-neutral-600 max-lg:w-full dark:text-neutral-400 sm:text-left sm:text-sm">
                {t("landing.simpleSetup.pillSub")}
              </span>
            </div>

            <h2 className={landingUi.headline}>
              {t("landing.simpleSetup.title")}
            </h2>
            <p className={cn(landingUi.subtitle, "text-neutral-700 dark:text-neutral-300")}>
              {t("landing.simpleSetup.subtitle")}
            </p>
          </motion.div>

          <div className="relative w-full" role="list" aria-label={t("landing.simpleSetup.stepsAria")}>
            <div
              aria-hidden
              className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-gradient-to-b from-primary/40 via-neutral-200 to-neutral-200 dark:via-neutral-700 dark:to-neutral-700 sm:left-5"
            />
            <div className="space-y-3 sm:space-y-3.5">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <motion.button
                    key={step.title}
                    type="button"
                    role="listitem"
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => setActiveStep(idx)}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className={cn(
                      "group relative w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300 sm:px-5 sm:py-5",
                      isActive
                        ? "border-primary/30 bg-white shadow-[0_2px_4px_rgba(15,15,15,0.04),0_14px_36px_rgba(235,153,44,0.12)] ring-2 ring-primary/15 dark:bg-neutral-900 dark:ring-primary/25"
                        : "border-neutral-200/90 bg-white/90 shadow-sm hover:border-neutral-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900/80 dark:hover:border-neutral-600",
                    )}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <span
                        className={cn(
                          "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10",
                          isActive
                            ? "bg-primary text-white shadow-[0_4px_14px_rgba(235,153,44,0.35)]"
                            : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5 sm:space-y-2">
                        <p
                          className={cn(
                            "text-[16px] font-semibold leading-snug tracking-tight sm:text-[17px]",
                            isActive ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-800 dark:text-neutral-100",
                          )}
                        >
                          {step.title}
                        </p>
                        <p className="text-[14px] leading-[1.62] text-neutral-600 dark:text-neutral-400 sm:text-[15px]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn(landingUi.visualColumn, "lg:order-2 lg:sticky lg:top-24")}
        >
          <div className="relative w-full">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(ellipse_75%_65%_at_50%_50%,rgba(235,153,44,0.1),transparent_65%)] sm:-inset-6"
            />
            <LiveInMinutesLaptopDemo
              videoSrc={import.meta.env.VITE_LIVE_IN_MINUTES_DEMO_VIDEO}
              activeIndex={activeStep}
              onActiveIndexChange={handleDemoIndexChange}
            />

            <div className="pointer-events-none absolute -right-1 top-4 z-10 hidden sm:block lg:right-2">
              <div className="rounded-2xl border border-neutral-200/95 bg-white/95 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,15,15,0.08)] ring-1 ring-neutral-900/[0.04] backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/95">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("landing.simpleSetup.floatSetupLabel")}
                </p>
                <p className="mt-0.5 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {t("landing.simpleSetup.floatSetupValue")}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-16 left-0 z-10 hidden sm:block lg:bottom-20">
              <div className="rounded-2xl border border-neutral-200/95 bg-white/95 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,15,15,0.08)] ring-1 ring-neutral-900/[0.04] backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/95">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("landing.simpleSetup.floatTimeLabel")}
                </p>
                <p className="mt-0.5 text-sm font-bold text-primary">{t("landing.simpleSetup.floatTimeValue")}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
