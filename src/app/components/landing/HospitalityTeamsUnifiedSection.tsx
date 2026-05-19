import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import HospitalityBusinessesMarquee from "@/components/ui/team";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import { landingUi } from "@/components/landing/landingUi";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingFadeReveal } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

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
      className={cn(
        landingUi.hospitalitySection,
        "bg-[linear-gradient(180deg,#f4f5f7_0%,#f1f0ee_48%,#f7f6f4_100%)] dark:bg-[linear-gradient(180deg,#171717_0%,#101010_52%,#171717_100%)]",
      )}
    >
      <motion.div className="mx-auto w-full max-w-7xl min-w-0" {...landingFadeReveal}>
        <header className={landingUi.hospitalityIntro}>
          <h2 className={landingUi.hospitalityTitle}>{t("landing.hospitality.title")}</h2>
          <p className={landingUi.hospitalitySubtitle}>{t("landing.hospitality.subtitle")}</p>
        </header>

        <motion.div className={landingUi.hospitalityGrid}>
          <div className="order-2 min-w-0 lg:order-1">
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

          <div className="order-1 min-w-0 lg:order-2">
            <div className={landingUi.hospitalityMediaStack}>
              <LandingSectionAccent variant="line" className="max-lg:mx-auto">
                {t("landing.hospitality.pill")}
              </LandingSectionAccent>
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
