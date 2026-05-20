import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import HospitalityBusinessesMarquee from "@/components/ui/team";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
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
        "caretip-landing-hospitality relative dark:bg-[linear-gradient(180deg,#171717_0%,#101010_52%,#171717_100%)]",
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
          <LandingSectionAccent variant="line" className="max-lg:mx-auto lg:mx-0">
            {t("landing.hospitality.pill")}
          </LandingSectionAccent>
        </header>

        <motion.div className={cn(landingUi.hospitalityGrid, "lg:grid")}>
          <div className={cn("min-w-0", landingUi.mobileStackAfter, "lg:order-1")}>
            <div className={landingUi.hospitalityFeaturePanel}>
              {features.map((f, idx) => (
                <LandingBenefitBlock
                  key={`hospitality-feature-${idx}`}
                  variant="split"
                  title={f.title}
                  description={f.text}
                  className={landingUi.showcaseBenefitRow}
                />
              ))}
            </div>
          </div>

          <div className={cn("min-w-0", landingUi.mobileStackVisual, "lg:order-2")}>
            <div className={landingUi.hospitalityMediaStack}>
              <div className={landingUi.hospitalityMediaCard}>
                <HospitalityBusinessesMarquee />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

