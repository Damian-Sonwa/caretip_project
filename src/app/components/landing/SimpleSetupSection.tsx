import { useMemo } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LiveInMinutesLaptopDemo } from "./LiveInMinutesLaptopDemo";
import { LandingCheckBadge } from "@/components/landing/LandingCheckBadge";

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
      className="scroll-mt-[80px] bg-white px-2 py-16 max-md:overflow-x-hidden sm:px-6 sm:py-20 lg:py-24 dark:bg-neutral-950"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 flex w-full max-w-full flex-col items-center text-center max-md:px-1 max-md:pt-2 lg:order-1 lg:items-start lg:px-0 lg:pt-0 lg:text-left md:px-0 md:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="flex w-full max-w-full flex-col items-center space-y-4 lg:items-start"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("landing.simpleSetup.pill")}
                </span>
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {t("landing.simpleSetup.pillSub")}
                </span>
              </div>

              <h2 className="max-w-xl text-balance text-3xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl">
                {t("landing.simpleSetup.title")}
              </h2>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-lg">
                {t("landing.simpleSetup.subtitle")}
              </p>
            </motion.div>

            <div className="relative mt-2 w-full max-w-full">
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.06 }}
                    className="group relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70 transition-shadow hover:shadow-md dark:bg-neutral-950 dark:ring-neutral-800"
                  >
                    <div className="flex items-start gap-4">
                      <LandingCheckBadge className="mt-0.5 shrink-0" />
                      <div className="min-w-0 text-left">
                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
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
            className="relative order-1 flex w-full max-w-[95%] flex-col items-center justify-center lg:order-2 lg:mx-auto lg:w-full lg:max-w-none"
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
