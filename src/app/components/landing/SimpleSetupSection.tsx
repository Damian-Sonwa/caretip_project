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
      className="scroll-mt-[80px] w-full min-w-0 bg-[linear-gradient(180deg,#ffffff_0%,#fafaf8_50%,#ffffff_100%)] px-3 py-10 max-md:overflow-x-hidden max-md:pt-14 sm:px-6 sm:py-16 lg:py-20 dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#141414_50%,#0a0a0a_100%)]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center justify-items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:justify-items-stretch lg:gap-12">
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
              <div className="space-y-3.5 max-md:space-y-4">
                {steps.map((step, idx) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.06 }}
                    className="group relative rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-gray-200/70 transition-shadow hover:shadow-md max-md:py-5 sm:px-6 sm:py-6 dark:bg-neutral-950 dark:ring-neutral-800"
                  >
                    <div className="flex flex-col gap-3 max-md:gap-3.5 sm:flex-row sm:items-start sm:gap-4">
                      <LandingCheckBadge className="shrink-0 sm:mt-0.5" />
                      <div className="min-w-0 space-y-2 text-left">
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
            className="relative order-1 mx-auto flex w-full max-w-[min(100%,40rem)] flex-col items-center justify-center lg:order-2 lg:mx-auto lg:w-full lg:max-w-none"
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
