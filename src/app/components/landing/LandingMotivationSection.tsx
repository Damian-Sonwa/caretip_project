import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingBenefitChecklist } from "@/components/landing/LandingCheckBadge";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingFadeReveal, landingFadeRevealWithDelay } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";
import { LandingMotivationActivityStack } from "./LandingMotivationActivityStack";

export function LandingMotivationSection() {
  const { t } = useTranslation();
  const subtitle = t("landing.motivation.subtitle");
  const points = useMemo(
    () => [t("landing.motivation.point1"), t("landing.motivation.point2"), t("landing.motivation.point3")],
    [t],
  );

  return (
    <section
      id="recognition"
      className={cn(
        landingUi.section,
        landingUi.sectionWhite,
        "caretip-landing-motivation relative scroll-mt-[80px] overflow-hidden",
      )}
    >
      <div className="caretip-motivation-ambient" aria-hidden />

      <div
        className={cn(
          landingUi.sectionShell,
          landingUi.splitGrid,
          "relative",
        )}
      >
        <motion.div
          className={cn(landingUi.copyColumn, "lg:order-1")}
          {...landingFadeReveal}
        >
          <div className={cn(landingUi.copyStack, landingUi.mobileStackIntro)}>
            {landingCopyVisible(t("landing.motivation.pill")) ? (
              <div className={landingUi.sectionAccentRow}>
                <LandingSectionAccent variant="spark">{t("landing.motivation.pill")}</LandingSectionAccent>
              </div>
            ) : null}

            <h2 className={landingUi.headline}>{t("landing.motivation.title")}</h2>

            {landingCopyVisible(subtitle) ? (
              <p className={landingUi.subtitle}>{subtitle}</p>
            ) : null}

            <LandingBenefitChecklist
              items={points.filter(landingCopyVisible)}
              tone="split"
              className="caretip-motivation-points max-lg:mx-auto max-lg:max-w-md lg:mx-0"
            />

            <div className="mt-7 flex w-full max-lg:justify-center lg:mt-8">
              <Link
                to="/auth?mode=signup&role=business&from=landing-recognition"
                className={cn(landingUi.heroCtaPrimary, "inline-flex gap-2 px-8")}
              >
                {t("landing.showcase.primaryCta")}
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={cn(landingUi.visualColumn, "lg:order-2 lg:justify-end")}
          {...landingFadeRevealWithDelay(0.08)}
        >
          <LandingMotivationActivityStack />
        </motion.div>
      </div>
    </section>
  );
}
