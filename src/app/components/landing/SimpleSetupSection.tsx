import { useMemo } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LiveInMinutesLaptopDemo } from "./LiveInMinutesLaptopDemo";
import { LandingCheckBadge } from "@/components/landing/LandingCheckBadge";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

export function SimpleSetupSection() {
  const { t } = useTranslation();

  const steps = useMemo(
    () =>
      [
        {
          title: t("landing.simpleSetup.step1Title"),
          description: t("landing.simpleSetup.step1Desc"),
        },
        {
          title: t("landing.simpleSetup.step2Title"),
          description: t("landing.simpleSetup.step2Desc"),
        },
        {
          title: t("landing.simpleSetup.step3Title"),
          description: t("landing.simpleSetup.step3Desc"),
        },
        {
          title: t("landing.simpleSetup.step4Title"),
          description: t("landing.simpleSetup.step4Desc"),
        },
      ],
    [t],
  );

  return (
    <section
      id="how-it-works"
      className={cn(
        landingUi.section,
        "max-md:overflow-x-hidden max-md:pt-12 bg-[linear-gradient(180deg,#ffffff_0%,#fafaf8_50%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#141414_50%,#0a0a0a_100%)]",
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className={landingUi.splitGrid}>
          <div className={cn(landingUi.copyColumn, "lg:order-1")}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className={landingUi.copyStack}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 sm:gap-2 sm:px-3 sm:py-1 sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                  {t("landing.simpleSetup.pill")}
                </span>
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400 sm:text-sm">
                  {t("landing.simpleSetup.pillSub")}
                </span>
              </div>

              <h2 className={landingUi.headline}>{t("landing.simpleSetup.title")}</h2>
              <p className={landingUi.subtitle}>{t("landing.simpleSetup.subtitle")}</p>
            </motion.div>

            <div className="relative w-full max-w-full max-lg:mt-1">
              <div className="space-y-3 max-lg:space-y-3 sm:space-y-3.5">
                {steps.map((step, idx) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.06 }}
                    className="group relative rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-gray-200/70 transition-shadow hover:shadow-md max-md:py-5 sm:px-6 sm:py-6 dark:bg-neutral-950 dark:ring-neutral-800"
                  >
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-4">
                      <LandingCheckBadge className="mt-0.5 shrink-0" />
                      <div className="min-w-0 space-y-1.5 text-left">
                        <p className="text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                          {step.title}
                        </p>
                        <p className="text-[15px] font-medium leading-[1.55] text-neutral-600 dark:text-neutral-400 sm:text-sm sm:font-normal sm:leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn(landingUi.visualColumn, "lg:order-2 lg:mx-auto lg:max-w-none")}
          >
            <div className="relative w-full overflow-visible rounded-[2.5rem] shadow-xl ring-1 ring-black/[0.06]">
              <div className="relative w-full px-0 pb-2 sm:px-0">
                <LiveInMinutesLaptopDemo videoSrc={import.meta.env.VITE_LIVE_IN_MINUTES_DEMO_VIDEO} />

                <div className="pointer-events-none absolute -right-1 top-2 z-10 hidden sm:block lg:right-0">
                  <div className="rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 text-left shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
                    <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {t("landing.simpleSetup.floatSetupLabel")}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {t("landing.simpleSetup.floatSetupValue")}
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-10 left-0 z-10 hidden sm:block">
                  <div className="rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
                    <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {t("landing.simpleSetup.floatTimeLabel")}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {t("landing.simpleSetup.floatTimeValue")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
