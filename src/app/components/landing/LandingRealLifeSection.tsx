import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import logyImg from "../../../../images/logy.png";
import repImg from "../../../../images/rep.png";
import mid001Img from "../../../../images/mid001.png";
import fieldServicesImg from "../../../../images/trade and home services.webp";
import { landingStaggerDelay } from "@/lib/landingMotion";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingBoldComponents } from "@/components/landing/landingRichText";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { ExpandableInfoCard } from "@/components/ui/expandable-info-card";
import { cn } from "@/lib/utils";

export function LandingRealLifeSection() {
  const { t, i18n } = useTranslation();

  const scenarios = useMemo(
    () =>
      [
        {
          headline: t("landing.realLife.s1Headline"),
          tag: t("landing.realLife.s1Tag"),
          textKey: "landing.realLife.s1Text" as const,
          detail: t("landing.realLife.s1Detail"),
          img: logyImg,
          alt: t("landing.realLife.s1Alt"),
        },
        {
          headline: t("landing.realLife.s2Headline"),
          tag: t("landing.realLife.s2Tag"),
          textKey: "landing.realLife.s2Text" as const,
          detail: t("landing.realLife.s2Detail"),
          img: repImg,
          alt: t("landing.realLife.s2Alt"),
        },
        {
          headline: t("landing.realLife.s4Headline"),
          tag: t("landing.realLife.s4Tag"),
          textKey: "landing.realLife.s4Text" as const,
          detail: t("landing.realLife.s4Detail"),
          img: mid001Img,
          alt: t("landing.realLife.s4Alt"),
        },
        {
          headline: t("landing.realLife.s5Headline"),
          tag: t("landing.realLife.s5Tag"),
          textKey: "landing.realLife.s5Text" as const,
          detail: t("landing.realLife.s5Detail"),
          img: fieldServicesImg,
          alt: t("landing.realLife.s5Alt"),
        },
      ],
    [t, i18n.language],
  );

  const learnMore = t("landing.realLife.learnMore");
  const learnLess = t("landing.realLife.learnLess");

  return (
    <section id="real-life" className={cn(landingUi.section, landingUi.sectionWhite, "caretip-landing-rhythm-stone")}>
      <div className="mx-auto max-w-7xl">
        <div className={cn(landingUi.sectionIntro, "caretip-real-life-section-intro")}>
          <h2
            className={cn(
              landingUi.sectionTitle,
              "max-lg:caretip-mobile-section-headline caretip-real-life-section-title caretip-landing-scroll-reveal--visible",
            )}
          >
            {t("landing.realLife.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:justify-items-stretch sm:gap-6 lg:gap-7">
          {scenarios.map((item, idx) => (
            <LandingReveal
              key={item.headline}
              delay={landingStaggerDelay(idx, 0.07)}
              className="w-full max-w-md sm:max-w-none"
            >
              <ExpandableInfoCard
                imageSrc={item.img}
                imageAlt={item.alt}
                title={item.headline}
                tag={landingCopyVisible(item.tag) ? item.tag : undefined}
                summary={
                  <Trans i18nKey={item.textKey} components={landingBoldComponents} />
                }
                detail={item.detail}
                learnMoreLabel={learnMore}
                learnLessLabel={learnLess}
                className={cn(
                  landingUi.mobileStackCard,
                  landingUi.realLifeCard,
                  "caretip-real-life-card",
                )}
                imageClassName={cn(landingUi.realLifeCardImage, "caretip-real-life-card-image")}
                titleClassName={cn(landingUi.realLifeCardTitle, "text-left")}
              />
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
