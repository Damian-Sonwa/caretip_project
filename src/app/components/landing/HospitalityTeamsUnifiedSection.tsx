import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import HospitalityBusinessesMarquee from "@/components/ui/team";
import { HospitalityFeaturePanel } from "@/components/landing/HospitalityFeaturePanel";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingFadeReveal } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

export function HospitalityTeamsUnifiedSection() {
  const { t } = useTranslation();
  const sectionSubtitle = t("landing.hospitality.subtitle");

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
      className={cn(
        landingUi.hospitalitySection,
        "caretip-landing-hospitality relative",
      )}
    >
      <motion.div
        className={cn("mx-auto w-full max-w-7xl min-w-0", landingUi.mobileStackGrid)}
        {...landingFadeReveal}
      >
        <header className={landingUi.hospitalityIntro}>
          <h2 className={landingUi.hospitalityTitle}>{t("landing.hospitality.title")}</h2>
          {landingCopyVisible(sectionSubtitle) ? (
            <p className={landingUi.hospitalitySubtitle}>{sectionSubtitle}</p>
          ) : null}
        </header>

        <motion.div className={cn(landingUi.hospitalityGrid, "lg:grid")}>
          <div className={cn("min-w-0", landingUi.mobileStackAfter, "lg:order-1")}>
            <div className={landingUi.hospitalityFeaturePanel}>
              <HospitalityFeaturePanel features={features} />
            </div>
          </div>

          <div className={cn("min-w-0", landingUi.mobileStackVisual, "lg:order-2")}>
            <div className={landingUi.hospitalityMediaStack}>
              <div
                className={cn(
                  landingUi.hospitalityMediaCard,
                  "caretip-hospitality-media-stage flex flex-col overflow-hidden",
                )}
              >
                <div className="caretip-hospitality-media-eyebrow shrink-0 px-4 pb-2.5 pt-4 text-center sm:px-5 sm:pt-5 lg:px-6 lg:pb-3 lg:pt-5 lg:text-left">
                  <span className="caretip-hospitality-media-label font-sans text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {t("landing.hospitality.pill")}
                  </span>
                </div>
                <div className="caretip-hospitality-media-visual relative min-h-0 flex-1 overflow-hidden">
                  <div aria-hidden className="caretip-hospitality-media-glow" />
                  <div aria-hidden className="caretip-hospitality-media-overlay" />
                  <div aria-hidden className="caretip-hospitality-media-vignette" />
                  <HospitalityBusinessesMarquee />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
