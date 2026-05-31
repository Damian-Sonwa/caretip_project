import { motion } from "motion/react";
import { BarChart3, QrCode, Shield, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeatureMomentVisual } from "@/components/public/features/FeatureMomentVisual";
import { FEATURE_MOMENT_KEYS } from "@/components/public/features/featuresPageConfig";
import { cn } from "@/lib/utils";

const MOMENT_ICONS = {
  qr: QrCode,
  employee: Users,
  payouts: Shield,
  analytics: BarChart3,
} as const;

export function FeaturesProductMoments() {
  const { t } = useTranslation();

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="text-[clamp(1.35rem,3vw,1.75rem)] font-semibold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50">
          {t("staticPages.features.momentsTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-neutral-700 sm:text-[0.9375rem] dark:text-neutral-300">
          {t("staticPages.features.momentsSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {FEATURE_MOMENT_KEYS.map((key, idx) => {
          const Icon = MOMENT_ICONS[key];
          return (
            <motion.div
              key={key}
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.07 }}
              className={cn(
                "group overflow-hidden rounded-2xl border border-neutral-200/80 bg-[#fafaf8]/90 shadow-sm transition-[box-shadow,border-color] duration-300",
                "hover:border-primary/15 hover:shadow-[0_10px_36px_-14px_rgba(15,23,42,0.12)] dark:border-neutral-800 dark:bg-neutral-900/60",
              )}
            >
              <FeatureMomentVisual moment={key} className="m-0 rounded-none border-0 border-b border-neutral-200/60 dark:border-neutral-800" />
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                    {t(`staticPages.features.moments.${key}.title`)}
                  </h3>
                </div>
                {t(`staticPages.features.moments.${key}.subtitle`) ? (
                  <p className="mb-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {t(`staticPages.features.moments.${key}.subtitle`)}
                  </p>
                ) : null}
                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {t(`staticPages.features.moments.${key}.body`)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
