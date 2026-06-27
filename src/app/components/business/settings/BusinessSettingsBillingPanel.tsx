import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";
import { useBillingStatus } from "../../../hooks/useBillingStatus";
import { createBillingPortalSession, type SubscriptionBillingCycle } from "../../../lib/api";
import { toUserFriendlyMessage } from "../../../lib/errorMessages";
import { BillingPlanManagement } from "./billing/BillingPlanManagement";
import { BillingTrialSection, BILLING_START_TRIAL_HASH } from "./billing/BillingTrialSection";
import { BillingSubscriptionLifecycle } from "./billing/BillingSubscriptionLifecycle";
import { BillingSubscriptionSummary } from "./billing/BillingSubscriptionSummary";
import { BillingTimeline } from "./billing/BillingTimeline";
import { CommercialInsightsPanel } from "./CommercialInsightsPanel";
import { PricingBillingToggle } from "@/components/pricing/PricingBillingToggle";
import { cn } from "@/lib/utils";
import { BILLING_PLANS_SECTION_ID, scrollToBillingPlansSection } from "../../../lib/activateCareTipNavigation";

export function BusinessSettingsBillingPanel() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const { data, loading, error, reload } = useBillingStatus();
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>("monthly");
  const [portalBusy, setPortalBusy] = useState(false);
  const [trialAutoOpen, setTrialAutoOpen] = useState(false);

  useEffect(() => {
    if (data?.billingCycle) {
      setBillingCycle(data.billingCycle);
    }
  }, [data?.billingCycle]);

  useEffect(() => {
    if (loading || !data) return;
    if (hash === `#${BILLING_START_TRIAL_HASH}`) {
      setTrialAutoOpen(true);
    }
  }, [loading, data, hash]);

  useEffect(() => {
    if (loading || !data || hash !== `#${BILLING_PLANS_SECTION_ID}`) return;
    const timer = window.setTimeout(() => scrollToBillingPlansSection("smooth"), 80);
    return () => window.clearTimeout(timer);
  }, [loading, data, hash]);

  async function openBillingPortal() {
    setPortalBusy(true);
    try {
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.portalError"));
    } finally {
      setPortalBusy(false);
    }
  }

  const canOpenPortal =
    Boolean(data?.billingEnabled && data.stripeConfigured && data.stripeCustomerId);

  return (
    <BusinessSettingsPanelShell>
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <span className="sr-only">{t("business.billing.loading")}</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-2 font-semibold underline underline-offset-2"
          >
            {t("business.billing.retry")}
          </button>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <BillingSubscriptionSummary
            billing={data}
            onManagePayment={canOpenPortal && !portalBusy ? () => void openBillingPortal() : undefined}
          />

          {data.accessSource !== "sponsored" &&
          (data.hasStripeBilling || (data.planKey && data.planKey !== "basic")) ? (
            <BillingSubscriptionLifecycle billing={data} />
          ) : null}

          <section id="billing-plans" className="space-y-5">
            {data.accessSource !== "sponsored" ? (
              <>
                <BillingTrialSection
                  billing={data}
                  billingCycle={billingCycle}
                  autoOpenTrial={trialAutoOpen}
                  onAutoOpenHandled={() => setTrialAutoOpen(false)}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 id="billing-cycle-heading" className="text-lg font-semibold text-foreground">
                    {t("business.billing.billingCycle")}
                  </h3>
                  {billingCycle === "yearly" ? (
                    <p className="mt-1 text-sm font-medium text-[var(--caretip-brand-orange,#e9781c)]">
                      {t("staticPages.pricing.billing.saveBadge")}
                    </p>
                  ) : null}
                </div>
                <PricingBillingToggle
                  value={billingCycle}
                  onChange={setBillingCycle}
                  className={cn("caretip-pricing-billing-toggle--in-panel sm:max-w-xs")}
                  aria-labelledby="billing-cycle-heading"
                />
              </div>
              </>
            ) : null}

            <BillingPlanManagement billing={data} billingCycle={billingCycle} onChanged={() => void reload()} />
          </section>

          {data.accessSource !== "sponsored" ? (
            <section>
              <h3 className="mb-4 text-lg font-semibold text-foreground">{t("business.billing.timelineTitle")}</h3>
              <BillingTimeline events={data.events} />
            </section>
          ) : null}

          <CommercialInsightsPanel />
        </div>
      ) : null}
    </BusinessSettingsPanelShell>
  );
}
