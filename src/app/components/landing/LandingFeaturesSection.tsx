import { useMemo } from "react";
import { motion } from "motion/react";
import { QrCode, LayoutDashboard, BarChart3, History, Wallet, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingUi } from "@/components/landing/landingUi";
import { landingType } from "@/components/landing/landingTypography";
import { cn } from "@/lib/utils";

const cardClassName = cn(
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/95 bg-white",
  "px-3.5 pb-4 pt-3.5 max-md:px-3.5 max-md:pb-4 max-md:pt-3.5 sm:px-6 sm:pb-7 sm:pt-6",
  "shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_28px_rgba(15,15,15,0.05)]",
  "transition-[transform,box-shadow,border-color] duration-300 ease-out",
  "md:hover:-translate-y-1 md:hover:border-primary/20",
  "md:hover:shadow-[0_2px_4px_rgba(15,15,15,0.05),0_16px_40px_rgba(235,153,44,0.1)]",
  "dark:border-neutral-700/90 dark:bg-neutral-900",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_rgba(0,0,0,0.42)]",
  "dark:md:hover:border-primary/30 dark:md:hover:shadow-[0_18px_44px_rgba(0,0,0,0.5)]",
);

const iconWrapClassName = cn(
  "mb-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg max-md:mb-2.5 max-md:h-9 max-md:w-9 sm:mb-5 sm:h-[52px] sm:w-[52px] sm:rounded-xl",
  "bg-primary/[0.14] text-primary ring-1 ring-primary/25",
  "transition-colors duration-300 group-hover:bg-primary/[0.18] group-hover:ring-primary/35",
  "dark:bg-primary/20 dark:text-[#f0a84d] dark:ring-primary/35",
);

const iconClassName =
  "h-4 w-4 stroke-[2.25] text-primary transition-transform duration-300 max-md:h-4 max-md:w-4 group-hover:scale-105 dark:text-[#f0a84d] sm:h-[22px] sm:w-[22px]";

const tagClassName = cn(
  "mb-2 inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/[0.08] px-2 py-0.5 max-md:mb-2",
  landingType.pill,
  "text-primary/90 dark:border-primary/25 dark:bg-primary/15 dark:text-[#f0a84d]",
);

export function LandingFeaturesSection() {
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      [
        {
          icon: QrCode,
          title: t("landing.features.i1Title"),
          text: t("landing.features.i1Text"),
          tag: t("landing.features.i1Tag"),
        },
        {
          icon: LayoutDashboard,
          title: t("landing.features.i2Title"),
          text: t("landing.features.i2Text"),
          tag: t("landing.features.i2Tag"),
        },
        {
          icon: BarChart3,
          title: t("landing.features.i3Title"),
          text: t("landing.features.i3Text"),
          tag: t("landing.features.i3Tag"),
        },
        {
          icon: History,
          title: t("landing.features.i4Title"),
          text: t("landing.features.i4Text"),
          tag: t("landing.features.i4Tag"),
        },
        {
          icon: Wallet,
          title: t("landing.features.i5Title"),
          text: t("landing.features.i5Text"),
          tag: t("landing.features.i5Tag"),
        },
        {
          icon: Star,
          title: t("landing.features.i6Title"),
          text: t("landing.features.i6Text"),
          tag: t("landing.features.i6Tag"),
        },
      ],
    [t],
  );

  return (
    <section
      id="features"
      className={cn(
        landingUi.section,
        "relative overflow-hidden lg:py-24",
        "border-y border-neutral-200/60 dark:border-neutral-800/80",
        "bg-[linear-gradient(180deg,#ffffff_0%,#f7f5f2_42%,#ffffff_100%)]",
        "dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#10100f_48%,#0a0a0a_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(235,153,44,0.05),transparent_55%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className={landingUi.sectionIntro}>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={landingUi.sectionTitle}
          >
            {t("landing.features.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className={landingUi.sectionSubtitle}
          >
            {t("landing.features.subtitle")}
          </motion.p>
        </div>

        <ul className="grid grid-cols-1 gap-2.5 max-md:gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                className="h-full"
              >
                <article className={cardClassName}>
                  <span className={tagClassName}>{item.tag}</span>
                  <div className={iconWrapClassName}>
                    <Icon className={iconClassName} aria-hidden />
                  </div>
                  <h3 className={cn(landingType.cardTitle, "tracking-tight")}>
                    {item.title}
                  </h3>
                  <p className={cn(landingUi.cardFeatureBody, "flex-1")}>
                    {item.text}
                  </p>
                </article>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
