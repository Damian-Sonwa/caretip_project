import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
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
        "caretip-landing-motivation relative scroll-mt-[80px]",
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
          <div
            className={cn(
              landingUi.copyStack,
              landingUi.mobileStackIntro,
              "caretip-motivation-copy",
            )}
          >
            {landingCopyVisible(t("landing.motivation.pill")) ? (
              <div
                className={cn(
                  landingUi.sectionAccentRow,
                  "caretip-motivation-accent-row",
                )}
              >
                <LandingSectionAccent variant="spark">{t("landing.motivation.pill")}</LandingSectionAccent>
              </div>
            ) : null}

            <h2 className={landingUi.headline}>{t("landing.motivation.title")}</h2>

            {landingCopyVisible(subtitle) ? (
              <p className={landingUi.subtitle}>{subtitle}</p>
            ) : null}
          </div>

          <div className={cn(landingUi.mobileStackAfter, "caretip-motivation-after w-full")}>
            <LandingBenefitChecklist
              items={points.filter(landingCopyVisible)}
              tone="split"
              className="caretip-motivation-points lg:mx-0"
            />

            <div className={cn(landingUi.sectionCtaCluster, "caretip-motivation-cta")}>
              <div className={landingUi.sectionCtaUnit}>
                <Link
                  to="/signup"
                  className={landingUi.sectionCtaPrimary}
                >
                  {t("landing.showcase.primaryCta")}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={cn(
            landingUi.visualColumn,
            landingUi.mobileStackVisual,
            "caretip-motivation-visual lg:order-2 lg:justify-end",
          )}
          {...landingFadeRevealWithDelay(0.08)}
        >
          <LandingMotivationActivityStack />
        </motion.div>
      </div>
    </section>
  );
}
