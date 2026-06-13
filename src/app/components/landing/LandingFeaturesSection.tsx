import { useMemo } from "react";
import { motion } from "motion/react";
import { QrCode, Activity, BarChart3, History, Wallet, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingType } from "@/components/landing/landingTypography";
import {
  LandingSectionAccent,
  type LandingAccentVariant,
} from "@/components/landing/LandingSectionAccent";
import { cn } from "@/lib/utils";

const cardClassName = cn(
  "caretip-landing-card caretip-landing-feature-card group relative flex h-full flex-col overflow-hidden rounded-2xl",
  "border border-neutral-200/80 bg-white/95",
  "px-4 pb-4 pt-4 sm:px-6 sm:pb-7 sm:pt-6",
  "dark:border-neutral-700/85 dark:bg-neutral-900/95",
);

const iconWrapBaseClassName = cn(
  "caretip-landing-feature-icon mb-3 shrink-0 sm:mb-5",
  "transition-[background,box-shadow,transform,border-color] duration-300 ease-out",
  "md:group-hover:-translate-y-px",
);

const iconGlyphClassName = "caretip-landing-feature-icon__glyph--obsidian";

const featureAccentVariants: LandingAccentVariant[] = [
  "spark",
  "trend",
  "arrow",
  "line",
  "spark",
  "trend",
];

export function LandingFeaturesSection() {
  const { t } = useTranslation();
  const sectionSubtitle = t("landing.features.subtitle");

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
          icon: Activity,
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
        landingUi.landingSurface,
        "caretip-landing-features-section relative overflow-hidden lg:py-24 dark:bg-neutral-950",
      )}
    >
      <div className="relative mx-auto max-w-7xl">
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
          <defs>
            <linearGradient id="caretip-features-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCC842" />
              <stop offset="42%" stopColor="#EF8728" />
              <stop offset="100%" stopColor="#171717" />
            </linearGradient>
            <linearGradient id="caretip-features-icon-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="40%" stopColor="#F6AB2A" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
          </defs>
        </svg>
        <div className={landingUi.sectionIntro}>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={landingUi.sectionTitle}
          >
            {t("landing.features.title")}
          </motion.h2>
          {landingCopyVisible(sectionSubtitle) ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className={landingUi.sectionSubtitle}
            >
              {sectionSubtitle}
            </motion.p>
          ) : null}
        </div>

        <ul className="caretip-landing-features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                  <LandingSectionAccent
                    variant={featureAccentVariants[idx % featureAccentVariants.length]}
                    className="caretip-landing-feature-accent mb-2.5 sm:mb-3"
                  >
                    {item.title}
                  </LandingSectionAccent>
                  <div
                    className={cn(
                      iconWrapBaseClassName,
                      "caretip-landing-feature-icon--obsidian",
                    )}
                  >
                    <Icon
                      className={iconGlyphClassName}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </div>
                  {landingCopyVisible(item.tag) ? (
                    <h3 className={cn(landingType.cardTitle, "tracking-tight text-neutral-900 dark:text-neutral-50")}>
                      {item.tag}
                    </h3>
                  ) : null}
                  <p className={cn(landingUi.cardFeatureBody, "flex-1 text-neutral-600 dark:text-neutral-400")}>
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
