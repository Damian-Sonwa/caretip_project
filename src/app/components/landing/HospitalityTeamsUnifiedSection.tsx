import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import HospitalityBusinessesMarquee from "@/components/ui/team";
import { HospitalityFeatureList } from "@/components/landing/HospitalityFeatureList";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingBoldComponents } from "@/components/landing/landingRichText";
import { landingStaggerDelay } from "@/lib/landingMotion";
import { cn } from "@/lib/utils";

function introParagraphVisible(t: (key: string) => string): boolean {
  return (
    landingCopyVisible(t("landing.hospitality.subtitle1")) ||
    landingCopyVisible(t("landing.hospitality.subtitle2")) ||
    landingCopyVisible(t("landing.hospitality.subtitle3"))
  );
}

export function HospitalityTeamsUnifiedSection() {
  const { t, i18n } = useTranslation();
  const isDe = i18n.language?.toLowerCase().startsWith("de");
  const features = useMemo(
    () =>
      [
        { title: t("landing.hospitality.f1Title"), text: t("landing.hospitality.f1Text") },
        { title: t("landing.hospitality.f2Title"), text: t("landing.hospitality.f2Text") },
        { title: t("landing.hospitality.f3Title"), text: t("landing.hospitality.f3Text") },
      ].filter((f) => landingCopyVisible(f.title) && landingCopyVisible(f.text)),
    [t, i18n.language],
  );

  return (
    <section
      id="built-for-hospitality"
      data-landing-lang={isDe ? "de" : "en"}
      className={cn(landingUi.hospitalitySection, "caretip-landing-hospitality")}
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <header className={cn(landingUi.hospitalityIntro, "caretip-hospitality-intro")}>
          {landingCopyVisible(t("landing.hospitality.eyebrow")) ? (
            <div className={cn(landingUi.sectionAccentRow, "mb-4")}>
              <LandingSectionAccent variant="spark">{t("landing.hospitality.eyebrow")}</LandingSectionAccent>
            </div>
          ) : null}
          <h2 className={cn(landingUi.hospitalityTitle, "caretip-hospitality-title")}>
            {t("landing.hospitality.title")}
          </h2>
          {introParagraphVisible(t) ? (
            <div className="caretip-hospitality-intro-copy">
              {landingCopyVisible(t("landing.hospitality.subtitle1")) ? (
                <p className={cn(landingUi.hospitalitySubtitle, "caretip-hospitality-subtitle")}>
                  {t("landing.hospitality.subtitle1")}
                </p>
              ) : null}
              {landingCopyVisible(t("landing.hospitality.subtitle2")) ? (
                <p className={cn(landingUi.hospitalitySubtitle, "caretip-hospitality-subtitle")}>
                  {t("landing.hospitality.subtitle2")}
                </p>
              ) : null}
              {landingCopyVisible(t("landing.hospitality.subtitle3")) ? (
                <p className={cn(landingUi.hospitalitySubtitle, "caretip-hospitality-subtitle")}>
                  <Trans i18nKey="landing.hospitality.subtitle3" components={landingBoldComponents} />
                </p>
              ) : null}
            </div>
          ) : null}
        </header>

        <LandingReveal delay={landingStaggerDelay(1)} className={cn(landingUi.hospitalityGrid, "caretip-hospitality-split")}>
          <HospitalityFeatureList features={features} />
          <div className="caretip-hospitality-showcase">
            {landingCopyVisible(t("landing.industries.title")) ? (
              <p className="caretip-hospitality-showcase-label">{t("landing.industries.title")}</p>
            ) : null}
            <div className="caretip-hospitality-showcase-visual">
              <HospitalityBusinessesMarquee />
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
