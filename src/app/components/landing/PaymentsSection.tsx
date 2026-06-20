import { useMemo } from "react";

import type { LucideIcon } from "lucide-react";

import { CreditCard as CreditCardIcon, Link2, Receipt, ShieldCheck } from "lucide-react";

import { useTranslation } from "react-i18next";

import paymentInfrastructureImg from "../../../../images/payment-infrastructure.png";

import paymentInfrastructureImgWebp from "../../../../images/payment-infrastructure.webp";

import { MarketingPicture } from "@/lib/marketingPicture";

import { LandingParallaxWrap } from "@/components/landing/LandingParallaxWrap";

import { landingStaggerDelay } from "@/lib/landingMotion";

import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";

import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";

import { LandingReveal } from "@/components/landing/LandingReveal";

import { landingType } from "@/components/landing/landingTypography";

import { cn } from "@/lib/utils";

import { PaymentsStripeBadge } from "./PaymentsStripeBadge";



type PaymentsTrustItem = {

  icon: LucideIcon;

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

        icon: CreditCardIcon,

        title: t("landing.paymentsTrust.b1Title"),

        text: t("landing.paymentsTrust.b1Text"),

      },

      { icon: Receipt, title: t("landing.paymentsTrust.b2Title"), text: t("landing.paymentsTrust.b2Text") },

      {

        icon: Link2,

        title: t("landing.paymentsTrust.b3Title"),

        text: t("landing.paymentsTrust.b3Text"),

      },

      {

        icon: ShieldCheck,

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

            <p className={cn(landingUi.sectionSubtitle, "mx-auto max-w-2xl")}>{sectionSubtitle}</p>

          ) : null}

          {landingCopyVisible(principle) ? (

            <p className={cn(landingUi.sectionSubtitle, "mx-auto mt-3 max-w-2xl")}>

              {landingCopyVisible(principleLabel) ? (

                <strong className="font-semibold text-neutral-900 dark:text-neutral-50">{principleLabel}</strong>

              ) : null}

              : {principle}

            </p>

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



          <ul

            className="caretip-payments-trust-grid grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:gap-9"

            role="list"

          >

            {items.map((item, idx) => {

              const Icon = item.icon;

              return (

                <LandingReveal

                  key={item.title}

                  as="li"

                  role="listitem"

                  delay={landingStaggerDelay(idx, 0.07)}

                  className="caretip-payments-trust-item group flex min-w-0 items-start gap-4"

                >

                  <div

                    className={cn(

                      "caretip-payments-trust-icon caretip-landing-feature-icon caretip-landing-feature-icon--obsidian",

                      "transition-[transform,opacity,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",

                    )}

                    aria-hidden

                  >

                    <Icon

                      className="caretip-landing-feature-icon__glyph--obsidian"

                      strokeWidth={2.25}

                    />

                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">

                    <h3

                      className={cn(

                        landingType.featureCopySemibold,

                        "tracking-tight text-neutral-900 dark:text-neutral-50",

                      )}

                    >

                      {item.title}

                    </h3>

                    <p

                      className={cn(

                        landingType.bodyCopyMuted,

                        "text-[0.8125rem] leading-snug sm:text-sm sm:leading-relaxed",

                      )}

                    >

                      {item.text}

                    </p>

                  </div>

                </LandingReveal>

              );

            })}

          </ul>

        </div>

      </div>

    </section>

  );

}

