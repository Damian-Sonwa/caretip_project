import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import paymentInfrastructureImg from "../../../../images/payment-infrastructure.png";

import paymentInfrastructureImgWebp from "../../../../images/payment-infrastructure.webp";

import { MarketingPicture } from "@/lib/marketingPicture";

import { LandingParallaxWrap } from "@/components/landing/LandingParallaxWrap";

import { landingStaggerDelay } from "@/lib/landingMotion";

import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";

import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";

import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";

import { LandingReveal } from "@/components/landing/LandingReveal";

import { LandingCopySentences } from "@/components/landing/LandingCopySentences";

import { cn } from "@/lib/utils";

import { PaymentsStripeBadge } from "./PaymentsStripeBadge";



type PaymentsTrustItem = {
  title: string;
  text: string;
};



export function PaymentsSection() {

  const { t, i18n } = useTranslation();

  const sectionSubtitle = t("landing.paymentsTrust.subtitle");

  const principleLabel = t("landing.paymentsTrust.principleLabel");

  const principle = t("landing.paymentsTrust.principle");



  const items = useMemo<PaymentsTrustItem[]>(

    () => [

      {
        title: t("landing.paymentsTrust.b1Title"),
        text: t("landing.paymentsTrust.b1Text"),
      },
      { title: t("landing.paymentsTrust.b2Title"), text: t("landing.paymentsTrust.b2Text") },
      {
        title: t("landing.paymentsTrust.b3Title"),
        text: t("landing.paymentsTrust.b3Text"),
      },
      {
        title: t("landing.paymentsTrust.b4Title"),
        text: t("landing.paymentsTrust.b4Text"),
      },

    ],

    [t, i18n.language],

  );



  return (

    <section

      id="payments-trust"

      className={cn(

        landingUi.section,

        landingUi.landingSurface,

        "caretip-payments-trust relative overflow-hidden dark:bg-[linear-gradient(180deg,#0c0c0c_0%,#111010_45%,#0c0c0c_100%)]",

      )}

    >

      <div aria-hidden className="caretip-payments-trust-ambient pointer-events-none absolute inset-0" />



      <div className="relative mx-auto max-w-7xl">

        <LandingReveal

          as="header"

          className={cn(

            landingUi.sectionIntro,

            "caretip-payments-trust-intro mx-auto mb-8 max-w-3xl text-center sm:mb-10 lg:mb-12",

          )}

        >

          {landingCopyVisible(t("landing.paymentsTrust.pill")) ? (

            <div className={cn(landingUi.sectionAccentRow, "mb-4 justify-center")}>

              <LandingSectionAccent variant="line" muted>

                {t("landing.paymentsTrust.pill")}

              </LandingSectionAccent>

            </div>

          ) : null}

          <h2 className={landingUi.sectionTitle}>{t("landing.paymentsTrust.title")}</h2>

          {landingCopyVisible(sectionSubtitle) ? (
            <LandingCopySentences
              text={sectionSubtitle}
              layout="paragraphs"
              className={cn(landingUi.sectionSubtitle, "caretip-payments-trust-intro-lead mx-auto")}
              sentenceClassName={landingUi.sectionSubtitle}
            />
          ) : null}
        </LandingReveal>

        <div className="caretip-payments-trust-body">

          <LandingReveal

            className="caretip-payments-trust-visual"

            delay={landingStaggerDelay(1)}

          >

            <PaymentsStripeBadge

              label={t("landing.paymentsTrust.stripeBadge")}

              className="caretip-payments-trust-stripe-badge mb-4"

            />

            <LandingParallaxWrap>

              <MarketingPicture

                src={paymentInfrastructureImg}

                webpSrc={paymentInfrastructureImgWebp}

                alt={t("landing.paymentsTrust.visualAlt")}

                className="caretip-payments-trust-visual-image w-full max-w-[26rem] rounded-2xl"

                loading="lazy"

                decoding="async"

              />

            </LandingParallaxWrap>

            <p className="caretip-payments-trust-card-hint">

              {t("landing.paymentsTrust.cardHint")}

            </p>

          </LandingReveal>



          <div className="caretip-payments-trust-list-shell">
            <div
              className={cn(
                landingUi.showcaseBenefits,
                landingUi.showcaseBenefitsPanel,
                "caretip-payments-trust-grid",
              )}
              role="list"
            >
              {items.map((item, idx) => (
                <LandingReveal key={item.title} delay={landingStaggerDelay(idx, 0.07)}>
                  <LandingBenefitBlock
                    variant="showcase"
                    title={item.title}
                    description={item.text}
                    bodyClassName="caretip-payments-trust-item__body text-[0.8125rem] leading-snug sm:text-sm sm:leading-relaxed"
                    className="caretip-payments-trust-item group min-w-0"
                  />
                </LandingReveal>
              ))}
            </div>

            {landingCopyVisible(principle) ? (
              <p className="caretip-payments-trust-principle">
                {landingCopyVisible(principleLabel) ? (
                  <strong className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {principleLabel}
                  </strong>
                ) : null}
                : {principle}
              </p>
            ) : null}
          </div>
        </div>

      </div>

    </section>

  );

}

