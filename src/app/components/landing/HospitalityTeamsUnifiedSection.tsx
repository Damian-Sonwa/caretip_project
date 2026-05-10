import { useMemo } from "react";
import { motion } from "motion/react";
import { QrCode } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";
import HospitalityBusinessesMarquee from "@/components/ui/team";
import { LandingCheckBadge } from "@/components/landing/LandingCheckBadge";

export function HospitalityTeamsUnifiedSection() {
  const { t } = useTranslation();

  const features = useMemo(
    () =>
      [
        { title: t("landing.hospitality.f1Title"), text: t("landing.hospitality.f1Text") },
        { title: t("landing.hospitality.f2Title"), text: t("landing.hospitality.f2Text") },
        { title: t("landing.hospitality.f3Title"), text: t("landing.hospitality.f3Text") },
        { title: t("landing.hospitality.f4Title"), text: t("landing.hospitality.f4Text") },
        { title: t("landing.hospitality.f5Title"), text: t("landing.hospitality.f5Text") },
      ],
    [t],
  );

  return (
    <section
      id="built-for-hospitality"
      className="scroll-mt-[80px] w-full max-w-full overflow-x-hidden bg-gray-50 px-6 pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pt-20 dark:bg-neutral-900"
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-8 w-full max-w-full space-y-3 text-center sm:mb-10 sm:space-y-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="mb-3 max-w-full break-words text-balance font-bold leading-[1.05] text-gray-900 text-[clamp(1.75rem,6vw,3.75rem)]">
              {t("landing.hospitality.title")}
            </h2>
            <p className="mx-auto max-w-3xl break-words text-pretty leading-relaxed text-gray-500 text-[clamp(1rem,2.6vw,1.25rem)]">
              {t("landing.hospitality.subtitle")}
            </p>
          </motion.div>
        </div>

        <div className="grid w-full min-w-0 gap-8 sm:gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-stretch lg:gap-12">
          <div className="min-w-0 lg:order-2">
            <LandingBorderedCard cardClassName="p-0">
              <motion.div
                initial={{ y: 6, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <QrCode className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>{t("landing.hospitality.pill")}</span>
              </motion.div>
              <HospitalityBusinessesMarquee />
            </LandingBorderedCard>
          </div>

          <div className="flex min-w-0 flex-col items-center lg:order-1 lg:items-stretch">
            <ul className="flex w-full min-w-0 max-w-full flex-col items-center space-y-4 lg:items-stretch">
              {features.map((f, idx) => (
                <motion.li
                  key={`hospitality-feature-${idx}`}
                  initial={{ y: 10, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
                  className="w-full max-w-full rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950/40"
                >
                  <div className="grid min-h-0 w-full min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                    <LandingCheckBadge className="mt-0.5" />
                    <div className="min-w-0 text-left">
                      <p className="max-w-full break-words text-lg font-bold tracking-tight text-gray-900 dark:text-neutral-100">
                        {f.title}
                      </p>
                      <p className="mt-1 max-w-full break-words text-base leading-relaxed text-gray-500 dark:text-neutral-300">
                        {f.text}
                      </p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
