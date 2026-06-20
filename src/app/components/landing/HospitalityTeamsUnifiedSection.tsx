import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import HospitalityBusinessesMarquee from "@/components/ui/team";
import { HospitalityFeaturePanel } from "@/components/landing/HospitalityFeaturePanel";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingBoldComponents } from "@/components/landing/landingRichText";
import { landingStaggerDelay } from "@/lib/landingMotion";
import { cn } from "@/lib/utils";

export function HospitalityTeamsUnifiedSection() {
  const { t, i18n } = useTranslation();
  const isDe = i18n.language?.toLowerCase().startsWith("de");
  const features = useMemo(
    () =>
      [
        { title: t("landing.hospitality.f1Title"), text: t("landing.hospitality.f1Text") },
        { title: t("landing.hospitality.f2Title"), text: t("landing.hospitality.f2Text") },
        { title: t("landing.hospitality.f3Title"), text: t("landing.hospitality.f3Text") },
        { title: t("landing.hospitality.f4Title"), text: t("landing.hospitality.f4Text") },
        { title: t("landing.hospitality.f5Title"), text: t("landing.hospitality.f5Text") },
      ].filter((f) => landingCopyVisible(f.title) && landingCopyVisible(f.text)),
    [t, i18n.language],
  );

  return (
    <section
      id="built-for-hospitality"
      data-landing-lang={isDe ? "de" : "en"}
      className={cn(
        landingUi.hospitalitySection,
        "caretip-landing-hospitality relative",
      )}
    >
      <LandingReveal className={cn("mx-auto w-full max-w-7xl min-w-0", landingUi.mobileStackGrid)}>
        <header
          className={cn(
            landingUi.hospitalityIntro,
            landingUi.mobileStackIntro,
            "caretip-hospitality-intro caretip-hospitality-intro--centered",
          )}
        >
          {landingCopyVisible(t("landing.hospitality.eyebrow")) ? (
            <p className="caretip-hospitality-eyebrow">{t("landing.hospitality.eyebrow")}</p>
          ) : null}
          <h2 className={landingUi.hospitalityTitle}>{t("landing.hospitality.title")}</h2>
          {landingCopyVisible(t("landing.hospitality.subtitle")) ? (
            <p className={landingUi.hospitalitySubtitle}>
              <Trans i18nKey="landing.hospitality.subtitle" components={landingBoldComponents} />
            </p>
          ) : null}
        </header>

        <LandingReveal
          delay={landingStaggerDelay(1)}
          className={cn(landingUi.hospitalityGrid, "caretip-hospitality-split lg:grid")}
        >
          <div className={cn("caretip-hospitality-features-col max-lg:contents lg:order-1")}>
            <div
              className={cn(
                "caretip-hospitality-features-stack min-w-0",
                landingUi.mobileStackAfter,
              )}
            >
              <div className={landingUi.hospitalityFeaturePanel}>
                <HospitalityFeaturePanel features={features} />
              </div>
            </div>
          </div>

          <div
            className={cn(
              "caretip-hospitality-visual-col min-w-0",
              landingUi.mobileStackVisual,
              "lg:order-2",
            )}
          >
            <div className={landingUi.hospitalityMediaStack}>
              <div className="caretip-hospitality-showcase">
                <div
                  className={cn(
                    landingUi.hospitalityMediaCard,
                    "caretip-hospitality-media-stage flex flex-col overflow-hidden",
                  )}
                >
                  {landingCopyVisible(t("landing.industries.title")) ? (
                    <div className="caretip-hospitality-media-eyebrow shrink-0">
                      <p className="caretip-hospitality-media-label">{t("landing.industries.title")}</p>
                    </div>
                  ) : null}
                  <div className="caretip-hospitality-media-visual relative min-h-0 flex-1 overflow-hidden">
                    <div aria-hidden className="caretip-hospitality-media-glow" />
                    <div aria-hidden className="caretip-hospitality-media-overlay" />
                    <div aria-hidden className="caretip-hospitality-media-vignette" />
                    <HospitalityBusinessesMarquee />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LandingReveal>
      </LandingReveal>
    </section>
  );
}
