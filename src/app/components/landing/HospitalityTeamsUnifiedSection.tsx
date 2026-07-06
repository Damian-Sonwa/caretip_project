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

function introCopyVisible(t: (key: string) => string): boolean {
  return ["subtitle1", "subtitle2", "subtitle3", "subtitle4", "subtitle5"].some((key) =>
    landingCopyVisible(t(`landing.hospitality.${key}`)),
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

  const hasLead = landingCopyVisible(t("landing.hospitality.subtitle1"));
  const hasBody =
    landingCopyVisible(t("landing.hospitality.subtitle2")) ||
    landingCopyVisible(t("landing.hospitality.subtitle3"));
  const hasClosing =
    landingCopyVisible(t("landing.hospitality.subtitle4")) ||
    landingCopyVisible(t("landing.hospitality.subtitle5"));

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
          {introCopyVisible(t) ? (
            <div className="caretip-hospitality-intro-copy">
              {hasLead ? (
                <p className="caretip-hospitality-lead">{t("landing.hospitality.subtitle1")}</p>
              ) : null}

              {hasBody ? (
                <div className="caretip-hospitality-body">
                  {landingCopyVisible(t("landing.hospitality.subtitle2")) ? (
                    <p className="caretip-hospitality-body__p">{t("landing.hospitality.subtitle2")}</p>
                  ) : null}
                  {landingCopyVisible(t("landing.hospitality.subtitle3")) ? (
                    <p className="caretip-hospitality-body__p">{t("landing.hospitality.subtitle3")}</p>
                  ) : null}
                </div>
              ) : null}

              {hasClosing ? (
                <div className="caretip-hospitality-closing">
                  {landingCopyVisible(t("landing.hospitality.subtitle4")) ? (
                    <p className="caretip-hospitality-closing__tagline">
                      <Trans
                        i18nKey="landing.hospitality.subtitle4"
                        components={landingBoldComponents}
                      />
                    </p>
                  ) : null}
                  {landingCopyVisible(t("landing.hospitality.subtitle5")) ? (
                    <p className="caretip-hospitality-closing__p">{t("landing.hospitality.subtitle5")}</p>
                  ) : null}
                </div>
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
