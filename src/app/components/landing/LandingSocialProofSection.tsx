import { useMemo } from "react";
import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingType } from "@/components/landing/landingTypography";
import { LandingTrustMetricsRow } from "@/app/components/landing/LandingTrustMetricsRow";
import { LandingVenueLogoStrip } from "@/app/components/landing/LandingVenueLogoStrip";
import { cn } from "@/lib/utils";

const cardClassName = cn(
  "caretip-landing-card flex h-full flex-col rounded-2xl border border-neutral-200/95 bg-white",
  "px-4 pb-5 pt-4 max-lg:px-4 max-lg:pb-5 max-lg:pt-4 sm:px-7 sm:pb-7 sm:pt-7",
  "shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_28px_rgba(15,15,15,0.06)]",
  "transition-[box-shadow,border-color] duration-300",
  "hover:border-neutral-300/90 hover:shadow-[0_2px_4px_rgba(15,15,15,0.05),0_14px_36px_rgba(15,15,15,0.08)]",
  "dark:border-neutral-700/90 dark:bg-neutral-900",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_rgba(0,0,0,0.45)]",
  "dark:hover:border-neutral-600",
);

export function LandingSocialProofSection() {
  const { t } = useTranslation();
  const sectionSubtitle = t("landing.socialProof.subtitle");

  const quotes = useMemo(
    () =>
      [
        { quote: t("landing.socialProof.q1Quote"), name: t("landing.socialProof.q1Name"), role: t("landing.socialProof.q1Role") },
        { quote: t("landing.socialProof.q2Quote"), name: t("landing.socialProof.q2Name"), role: t("landing.socialProof.q2Role") },
        { quote: t("landing.socialProof.q3Quote"), name: t("landing.socialProof.q3Name"), role: t("landing.socialProof.q3Role") },
      ],
    [t],
  );

  return (
    <section
      id="social-proof"
      className={cn(
        landingUi.section,
        landingUi.landingSurface,
        "caretip-landing-social-proof relative overflow-hidden dark:bg-neutral-950",
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn(landingUi.sectionIntro, "caretip-social-proof-intro")}
        >
          <h2 className={landingUi.sectionTitle}>
            {t("landing.socialProof.title")}
          </h2>
          {landingCopyVisible(sectionSubtitle) ? (
            <p className={landingUi.sectionSubtitle}>{sectionSubtitle}</p>
          ) : null}
        </motion.div>

        <div className="caretip-landing-trust-band caretip-social-proof-trust-band mx-auto w-full min-w-0 max-w-7xl overflow-x-clip">
          <LandingVenueLogoStrip className="caretip-landing-venue-logos--lead" />
          <LandingTrustMetricsRow className="caretip-landing-trust-metrics--follows-logos" />
        </div>

        <motion.div
          className="caretip-social-proof-quotes grid gap-3 max-lg:gap-3.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {quotes.map((item, idx) => (
            <motion.figure
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className={cn(cardClassName, "caretip-social-proof-card")}
            >
              <Quote
                className="mb-3 h-7 w-7 text-primary/55 max-lg:mb-3 max-lg:h-7 max-lg:w-7 dark:text-primary/65 sm:mb-5 sm:h-9 sm:w-9"
                strokeWidth={2}
                aria-hidden
              />
              <blockquote className={cn(landingUi.cardBodyLead, "flex-1 text-neutral-800 dark:text-neutral-200")}>
                <span className="text-neutral-400 dark:text-neutral-500" aria-hidden>
                  “
                </span>
                {item.quote}
                <span className="text-neutral-400 dark:text-neutral-500" aria-hidden>
                  ”
                </span>
              </blockquote>
              <figcaption className="mt-auto border-t border-neutral-200/90 pt-4 max-lg:pt-4 dark:border-neutral-700/90 sm:pt-5">
                <p className={cn(landingType.cardTitle, "tracking-tight")}>
                  {item.name}
                </p>
                <p className={cn(landingType.featureCopy, "mt-1 text-neutral-600 dark:text-neutral-400")}>
                  {item.role}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
