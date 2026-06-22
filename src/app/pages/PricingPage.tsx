import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { PricingSection } from "../components/PricingSection";
import { PRICING_TIER_DEFINITIONS, mapPricingTierFromI18n } from "../data/pricingConfig";
import {
  DEFAULT_PRICING_UI_STATE,
  YEARLY_BILLING_ENABLED,
} from "../data/pricingTypes";
import type { BillingCycle, Industry } from "../data/pricingTypes";
import { resolvePricingCopyScope } from "../data/pricingCopy";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { PublicTrustChips } from "@/components/public/PublicTrustChips";
import { publicPagesBrandUi } from "@/components/public/publicPagesBrandUi";
import { PricingControlsPanel } from "@/components/pricing/PricingControlsPanel";
import { PricingPlansIntro } from "@/components/pricing/PricingPlansIntro";
import { PricingTrustSignals } from "@/components/pricing/PricingTrustSignals";
import { PricingFaqSection } from "@/components/pricing/PricingFaqSection";
import { PricingYearlyNotice } from "@/components/pricing/PricingYearlyNotice";
import { pricingPageUi } from "@/components/pricing/pricingPageUi";
import { cn } from "@/lib/utils";
import { DeferredBelowFold } from "@/lib/publicRouteDefer";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

export function PricingPage() {
  usePublicMountProbe("PricingPage");
  const { t, i18n } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(DEFAULT_PRICING_UI_STATE.billingCycle);
  const [industry, setIndustry] = useState<Industry>(DEFAULT_PRICING_UI_STATE.industry);

  const copyScope = resolvePricingCopyScope(industry);
  const showYearlyNotice = billingCycle === "yearly" && !YEARLY_BILLING_ENABLED;

  const tiers = useMemo(
    () => PRICING_TIER_DEFINITIONS.map((def) => mapPricingTierFromI18n(t, def)),
    [t, i18n.language],
  );

  return (
    <PublicPageShell maxWidth="pricing">
      <main id="pricing" className="caretip-pricing-page scroll-mt-20">
        <div className="caretip-pricing-hero caretip-public-marketing-hero caretip-public-hero-enter text-center">
          <PublicPageHeader
            centered
            introLayout="heroGroup"
            showTrustChips={false}
            title={t(`${copyScope}.pageTitle`, {
              defaultValue: t("staticPages.pricing.pageTitle"),
            })}
            subtitle={t(`${copyScope}.pageSubtitle`, {
              defaultValue: t("staticPages.pricing.pageSubtitle"),
            })}
          />
          <div
            className={cn(
              "caretip-public-hero-pills",
              publicPagesBrandUi.warmDarkTrustStrip,
            )}
          >
            <PublicTrustChips
              variant="pricing"
              tone="onDark"
              className="caretip-public-hero-pills__list"
            />
          </div>
        </div>

        <section
          id="pricing-plans"
          className="caretip-pricing-plans-section"
          aria-label={t("staticPages.pricing.plansAria")}
        >
          <PricingPlansIntro copyScope={copyScope} className="mx-auto max-w-3xl" />

          <div className={pricingPageUi.controlsWrap}>
            <div className="caretip-pricing-controls-shell">
              <PricingControlsPanel
                industry={industry}
                billingCycle={billingCycle}
                onIndustryChange={setIndustry}
                onBillingCycleChange={setBillingCycle}
              />
              {showYearlyNotice ? <PricingYearlyNotice className="mt-4" /> : null}
              <PricingTrustSignals subtle className="caretip-pricing-trust--in-shell" />
            </div>
          </div>

          <p className="caretip-pricing-social-note mx-auto max-w-3xl text-center text-sm text-muted-foreground">
            {t("staticPages.pricing.socialProfessionsNote")}
          </p>

          <div className={pricingPageUi.cardsStage}>
            <div className="caretip-pricing-cards-stage__glow" aria-hidden />
            <PricingSection
              tiers={tiers}
              billingCycle={billingCycle}
              industry={industry}
              copyScope={copyScope}
            />
          </div>
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
