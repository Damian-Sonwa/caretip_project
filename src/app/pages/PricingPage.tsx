import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_PRICING_UI_STATE,
  YEARLY_BILLING_ENABLED,
} from "../data/pricingTypes";
import type { BillingCycle } from "../data/pricingTypes";
import {
  DEFAULT_PRICING_AUDIENCE,
  resolveCopyScopeForAudience,
  resolveIndustryForAudience,
  type PricingPageAudience,
} from "../data/pricingAudience";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PricingControlsPanel } from "@/components/pricing/PricingControlsPanel";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PricingCardsHotels } from "@/components/pricing/PricingCardsHotels";
import { PricingCardsFreelancers } from "@/components/pricing/PricingCardsFreelancers";
import { PricingFaqSection } from "@/components/pricing/PricingFaqSection";
import { PricingYearlyNotice } from "@/components/pricing/PricingYearlyNotice";
import { PricingContractModels } from "@/components/pricing/PricingContractModels";
import { PricingPackageAddOns } from "@/components/pricing/PricingPackageAddOns";
import { PricingSpecialConditionsBanner } from "@/components/pricing/PricingSpecialConditionsBanner";
import { PricingTrialCta } from "@/components/pricing/PricingTrialCta";
import { pricingPageUi } from "@/components/pricing/pricingPageUi";
import { cn } from "@/lib/utils";
import { DeferredBelowFold } from "@/lib/publicRouteDefer";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

export function PricingPage() {
  usePublicMountProbe("PricingPage");
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(DEFAULT_PRICING_UI_STATE.billingCycle);
  const [audience, setAudience] = useState<PricingPageAudience>(DEFAULT_PRICING_AUDIENCE);

  const copyScope = resolveCopyScopeForAudience(audience);
  const industry = resolveIndustryForAudience(audience);
  const showYearlyNotice = billingCycle === "yearly" && !YEARLY_BILLING_ENABLED;
  const isHotelsAudience = audience === "hotels_logistics";

  return (
    <PublicPageShell maxWidth="pricing">
      <main id="pricing" className="caretip-pricing-page scroll-mt-20">
        <PricingHero copyScope={copyScope} />

        <section
          id="pricing-plans"
          className="caretip-pricing-plans-section caretip-pricing-plans-section--after-hero"
          aria-label={t("staticPages.pricing.plansAria")}
        >
          <div className={pricingPageUi.controlsWrap}>
            <div className="caretip-pricing-controls-shell">
              <PricingControlsPanel
                audience={audience}
                billingCycle={billingCycle}
                onAudienceChange={setAudience}
                onBillingCycleChange={setBillingCycle}
              />
              {showYearlyNotice ? <PricingYearlyNotice className="mt-4" /> : null}
            </div>
          </div>

          <div className={pricingPageUi.cardsStage}>
            <div className="caretip-pricing-cards-stage__glow" aria-hidden />
            <div
              key={audience}
              className="caretip-pricing-cards-swap"
              data-pricing-audience={audience}
            >
              {isHotelsAudience ? (
                <PricingCardsHotels
                  billingCycle={billingCycle}
                  industry={industry}
                  copyScope={copyScope}
                />
              ) : (
                <PricingCardsFreelancers billingCycle={billingCycle} copyScope={copyScope} />
              )}
            </div>
          </div>

          <PricingSpecialConditionsBanner className="mt-8" />
          {isHotelsAudience ? (
            <>
              <PricingPackageAddOns className="mt-6" />
              <PricingContractModels billingCycle={billingCycle} className="mt-8" />
              <PricingTrialCta className="mx-auto mt-8 max-w-3xl" billingCycle={billingCycle} />
            </>
          ) : null}
        </section>

        <PricingFaqSection className={pricingPageUi.sectionGap} />

        <section className={cn(pricingPageUi.sectionGap, "pb-8 sm:pb-12")}>
          <DeferredBelowFold minHeight="12rem" rootMargin="200px 0px">
            <div className={pricingPageUi.ctaPanel}>
              <h3 className={pricingPageUi.ctaTitle}>{t("staticPages.pricing.ctaTitle")}</h3>
              <p className={pricingPageUi.ctaBody}>{t("staticPages.pricing.ctaBody")}</p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/contact?intent=demo" className={pricingPageUi.ctaButtonPrimary}>
                  {t("nav.requestDemo")}
                </Link>
                <Link to="/signup" className={pricingPageUi.ctaButtonSecondary}>
                  {t("nav.becomePartner")}
                </Link>
              </div>
            </div>
          </DeferredBelowFold>
        </section>
      </main>
    </PublicPageShell>
  );
}
