import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { LandingTrustMetricsRow } from "@/app/components/landing/LandingTrustMetricsRow";
import { LandingVenueLogoStrip } from "@/app/components/landing/LandingVenueLogoStrip";
import { LandingTestimonialsShowcase } from "@/app/components/landing/LandingTestimonialsShowcase";
import { cn } from "@/lib/utils";

export function LandingSocialProofSection() {
  const { t } = useTranslation();
  const sectionSubtitle = t("landing.socialProof.subtitle");

  return (
    <section
      id="social-proof"
      className={cn(
        landingUi.section,
        landingUi.landingSurface,
        "caretip-landing-social-proof relative overflow-hidden dark:bg-neutral-950",
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn(landingUi.sectionIntro, "caretip-social-proof-intro")}
        >
          <h2 className={landingUi.sectionTitle}>{t("landing.socialProof.title")}</h2>
          {landingCopyVisible(sectionSubtitle) ? (
            <p className={landingUi.sectionSubtitle}>{sectionSubtitle}</p>
          ) : null}
        </motion.div>

        <div className="caretip-landing-trust-band caretip-social-proof-trust-band mx-auto w-full min-w-0 max-w-7xl overflow-x-clip">
          <LandingVenueLogoStrip className="caretip-landing-venue-logos--lead" />
          <LandingTrustMetricsRow className="caretip-landing-trust-metrics--follows-logos" />
        </div>

        <div className="caretip-testimonials-panel">
          <LandingTestimonialsShowcase />
        </div>
      </div>
    </section>
  );
}
