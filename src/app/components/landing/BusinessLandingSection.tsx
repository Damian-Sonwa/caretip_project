import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LandingShowcaseCoverImage,
  LandingSplitShowcaseSection,
} from "@/app/components/landing/LandingSplitShowcaseSection";
import { landingCopyVisible } from "@/components/landing/landingUi";
import businessSectionImg from "../../../../images/Volle.png";
import businessSectionImgWebp from "../../../../images/Volle.webp";

export function BusinessLandingSection() {
  const { t, i18n } = useTranslation();

  const benefits = useMemo(
    () => [
      { title: t("landing.businessSection.b1Title"), description: t("landing.businessSection.b1Text") },
      { title: t("landing.businessSection.b2Title"), description: t("landing.businessSection.b2Text") },
      { title: t("landing.businessSection.b3Title"), description: t("landing.businessSection.b3Text") },
      { title: t("landing.businessSection.b4Title"), description: t("landing.businessSection.b4Text") },
    ],
    [t, i18n.language],
  );

  return (
    <LandingSplitShowcaseSection
      id="business-section"
      visualPosition="right"
      tone="warm"
      eyebrow={t("landing.businessSection.pill")}
      eyebrowVariant="arrow"
      titleLine1={t("landing.businessSection.titleLine1")}
      titleLine2={t("landing.businessSection.titleLine2")}
      subtitle={t("landing.businessSection.subtitle")}
      benefits={benefits}
      benefitsVariant="showcase"
      cta={{
        label: t("landing.businessSection.cta"),
        to: "/signup",
      }}
      visual={
        <LandingShowcaseCoverImage
          src={businessSectionImg}
          webpSrc={businessSectionImgWebp}
          alt={t("landing.businessSection.imageAlt")}
          objectPosition="center"
          floatHint={
            landingCopyVisible(t("landing.businessSection.floatHint"))
              ? t("landing.businessSection.floatHint")
              : undefined
          }
        />
      }
    />
  );
}
