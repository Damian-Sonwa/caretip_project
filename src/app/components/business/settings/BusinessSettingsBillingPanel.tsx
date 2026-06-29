import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBillingStatus } from "../../../hooks/useBillingStatus";
import { createBillingPortalSession, type SubscriptionBillingCycle } from "../../../lib/api";
import { toUserFriendlyMessage } from "../../../lib/errorMessages";
import { BillingPlanManagement } from "./billing/BillingPlanManagement";
import { BillingTrialSection, BILLING_START_TRIAL_HASH } from "./billing/BillingTrialSection";
import { BillingSubscriptionLifecycle } from "./billing/BillingSubscriptionLifecycle";
import { BillingSubscriptionSummary } from "./billing/BillingSubscriptionSummary";
import { BillingTimeline } from "./billing/BillingTimeline";
import { PricingBillingToggle } from "@/components/pricing/PricingBillingToggle";
import { dashboardWorkspaceUi } from "@/app/components/dashboard/dashboardWorkspaceUi";
import { cn } from "@/lib/utils";
import { BILLING_PLANS_SECTION_ID, scrollToBillingPlansSection } from "../../../lib/activateCareTipNavigation";

const BILLING_HISTORY_PREVIEW_LIMIT = 8;

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

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span className="sr-only">{t("business.billing.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-2 font-semibold underline underline-offset-2"
        >
          {t("business.billing.retry")}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const historyPreview = data.events.slice(0, BILLING_HISTORY_PREVIEW_LIMIT);

  return (
    <div className="space-y-8">
      <BillingSubscriptionSummary
        billing={data}
        onManagePayment={canOpenPortal && !portalBusy ? () => void openBillingPortal() : undefined}
      />

      <BillingSubscriptionLifecycle billing={data} />

      {data.accessSource !== "sponsored" && historyPreview.length > 0 ? (
        <section aria-labelledby="billing-history-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="billing-history-heading" className={dashboardWorkspaceUi.sectionTitle}>
              {t("business.billing.nav.history")}
            </h2>
            {data.events.length > BILLING_HISTORY_PREVIEW_LIMIT ? (
              <Link
                to="/dashboard/billing/history"
                className={cn(dashboardWorkspaceUi.btnGhost, "text-sm")}
              >
                {t("dashboard.viewAll")}
              </Link>
            ) : null}
          </div>
          <div className={cn(dashboardWorkspaceUi.card, dashboardWorkspaceUi.cardPad)}>
            <BillingTimeline events={historyPreview} />
          </div>
        </section>
      ) : null}

      {data.accessSource !== "sponsored" ? (
        <section id="billing-plans" className="space-y-5">
          <div>
            <h2 className={dashboardWorkspaceUi.sectionTitle}>{t("business.billing.planManagement")}</h2>
            <p className={dashboardWorkspaceUi.pageDescription}>{t("business.billing.planManagementDesc")}</p>
          </div>

          <BillingTrialSection
            billing={data}
            billingCycle={billingCycle}
            autoOpenTrial={trialAutoOpen}
            onAutoOpenHandled={() => setTrialAutoOpen(false)}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id="billing-cycle-heading" className={dashboardWorkspaceUi.subsectionTitle}>
                {t("business.billing.billingCycle")}
              </h3>
              {billingCycle === "yearly" ? (
                <p className="mt-1 text-sm font-medium text-primary">
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

          <BillingPlanManagement billing={data} billingCycle={billingCycle} onChanged={() => void reload()} />
        </section>
      ) : null}
    </div>
  );
}
