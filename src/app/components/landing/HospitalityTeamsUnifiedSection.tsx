import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import HospitalityBusinessesMarquee from "@/components/ui/team";
import { HospitalityFeatureList } from "@/components/landing/HospitalityFeatureList";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
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
      lang={isDe ? "de" : "en"}
      className={cn(landingUi.hospitalitySection, "caretip-landing-hospitality")}
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <header
          className={cn(
            landingUi.hospitalityIntro,
            "caretip-hospitality-intro",
            "mx-auto max-w-4xl py-20 text-center lg:py-28",
          )}
        >
          {landingCopyVisible(t("landing.hospitality.eyebrow")) ? (
            <div className={cn(landingUi.sectionAccentRow, "mb-4")}>
              <LandingSectionAccent variant="spark">{t("landing.hospitality.eyebrow")}</LandingSectionAccent>
            </div>
          ) : null}
          <h2
            className={cn(
              landingUi.hospitalityTitle,
              "caretip-hospitality-title",
              "mx-auto max-w-3xl text-balance",
              "text-3xl font-bold tracking-tight leading-tight text-neutral-950 md:text-4xl lg:text-5xl",
              "dark:text-neutral-50",
              isDe && "text-pretty hyphens-auto",
            )}
          >
            {t("landing.hospitality.title")}
          </h2>
          {introCopyVisible(t) ? (
            <div className="caretip-hospitality-intro-copy">
              {hasLead ? (
                <p
                  className={cn(
                    "caretip-hospitality-lead",
                    "mx-auto mt-6 max-w-3xl text-center text-balance",
                    "text-lg font-semibold text-neutral-700 md:text-xl dark:text-neutral-300",
                  )}
                >
                  {t("landing.hospitality.subtitle1")}
                </p>
              ) : null}

              {hasBody ? (
                <div
                  className={cn(
                    "caretip-hospitality-body",
                    "mx-auto mt-5 flex max-w-2xl flex-col items-center gap-4 text-center",
                    !hasLead && "mt-6",
                  )}
                >
                  {landingCopyVisible(t("landing.hospitality.subtitle2")) ? (
                    <p
                      className={cn(
                        "caretip-hospitality-body__p",
                        "m-0 text-pretty text-base leading-8 text-neutral-500 md:text-lg dark:text-neutral-400",
                      )}
                    >
                      {t("landing.hospitality.subtitle2")}
                    </p>
                  ) : null}
                  {landingCopyVisible(t("landing.hospitality.subtitle3")) ? (
                    <p
                      className={cn(
                        "caretip-hospitality-body__p",
                        "m-0 text-pretty text-base leading-8 text-neutral-500 md:text-lg dark:text-neutral-400",
                      )}
                    >
                      {t("landing.hospitality.subtitle3")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {hasClosing ? (
                <div className="caretip-hospitality-closing flex w-full flex-col items-center text-center">
                  {landingCopyVisible(t("landing.hospitality.subtitle4")) ? (
                    <div
                      className={cn(
                        landingUi.sectionAccentRow,
                        "caretip-hospitality-closing__accent mt-6 w-full justify-center lg:justify-center",
                      )}
                    >
                      <LandingSectionAccent
                        variant="spark"
                        className="caretip-hospitality-brand-accent mx-auto lg:mx-auto"
                      >
                        <Trans
                          i18nKey="landing.hospitality.subtitle4"
                          components={{ bold: <span /> }}
                        />
                      </LandingSectionAccent>
                    </div>
                  ) : null}
                  {landingCopyVisible(t("landing.hospitality.subtitle5")) ? (
                    <p
                      className={cn(
                        "caretip-hospitality-closing__p",
                        "mx-auto mt-4 max-w-2xl text-pretty text-base text-neutral-500 dark:text-neutral-400",
                        !landingCopyVisible(t("landing.hospitality.subtitle4")) && "mt-6",
                      )}
                    >
                      {t("landing.hospitality.subtitle5")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        <LandingReveal
          delay={landingStaggerDelay(1)}
          className={cn(landingUi.hospitalityGrid, "caretip-hospitality-split")}
        >
          <HospitalityFeatureList features={features} />
          <div className="caretip-hospitality-showcase">
            {landingCopyVisible(t("landing.industries.title")) ? (
              <div className="caretip-hospitality-showcase-header">
                <div
                  className={cn(
                    landingUi.sectionAccentRow,
                    "caretip-hospitality-showcase-accent w-full justify-center lg:justify-center",
                  )}
                >
                  <LandingSectionAccent
                    variant="spark"
                    className={cn(
                      "caretip-hospitality-brand-accent mx-auto lg:mx-auto",
                      isDe && "max-w-[min(100%,36rem)]",
                    )}
                  >
                    <span className={isDe ? "text-pretty hyphens-auto" : undefined}>
                      {t("landing.industries.title")}
                    </span>
                  </LandingSectionAccent>
                </div>
              </div>
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
