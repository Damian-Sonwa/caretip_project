import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { LandingBenefitChecklist } from "@/components/landing/LandingCheckBadge";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingFadeReveal, landingFadeRevealWithDelay } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";
import { LandingMotivationActivityFeedMobile } from "./LandingMotivationActivityFeedMobile";
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
          <div
            className={cn(
              landingUi.copyStack,
              landingUi.mobileStackIntro,
              "caretip-motivation-copy max-md:items-start max-md:text-left",
            )}
          >
            {landingCopyVisible(t("landing.motivation.pill")) ? (
              <div
                className={cn(
                  landingUi.sectionAccentRow,
                  "caretip-motivation-accent-row max-md:justify-start",
                )}
              >
                <LandingSectionAccent variant="spark">{t("landing.motivation.pill")}</LandingSectionAccent>
              </div>
            ) : null}

            <h2 className={landingUi.headline}>{t("landing.motivation.title")}</h2>

            {landingCopyVisible(subtitle) ? (
              <p className={landingUi.subtitle}>{subtitle}</p>
            ) : null}

            <div className="caretip-motivation-mobile-feed w-full md:hidden">
              <LandingMotivationActivityFeedMobile />
            </div>

            <LandingBenefitChecklist
              items={points.filter(landingCopyVisible)}
              tone="split"
              className="caretip-motivation-points max-md:mx-0 max-md:max-w-none lg:mx-0"
            />

            <div className="caretip-motivation-cta mt-5 flex w-full max-md:justify-start max-lg:justify-center sm:mt-7 lg:mt-8 lg:justify-start">
              <Link
                to="/auth?mode=signup&role=business&from=landing-recognition"
                className={cn(landingUi.heroCtaPrimary, "inline-flex gap-2 px-8")}
              >
                {t("landing.showcase.primaryCta")}
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={cn(landingUi.visualColumn, "max-md:hidden lg:order-2 lg:justify-end")}
          {...landingFadeRevealWithDelay(0.08)}
        >
          <LandingMotivationActivityStack />
        </motion.div>
      </div>
    </section>
  );
}
