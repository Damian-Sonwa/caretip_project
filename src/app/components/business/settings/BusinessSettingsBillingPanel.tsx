import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";
import { useBillingStatus } from "../../../hooks/useBillingStatus";
import type { SubscriptionBillingCycle } from "../../../lib/api";
import { BillingCurrentPlanCard } from "./billing/BillingCurrentPlanCard";
import { BillingPlanManagement } from "./billing/BillingPlanManagement";
import { BillingTimeline } from "./billing/BillingTimeline";
import { CommercialInsightsPanel } from "./CommercialInsightsPanel";

export function BusinessSettingsBillingPanel() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useBillingStatus();
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>("monthly");

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
          <BillingCurrentPlanCard billing={data} />

          <section id="billing-plans">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">{t("business.billing.billingCycle")}</h3>
              <div className="inline-flex rounded-lg border border-border p-1">
                {(["monthly", "yearly"] as const).map((cycle) => {
                  const active = billingCycle === cycle;
                  return (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`business.billing.cycle${cycle === "monthly" ? "Monthly" : "Yearly"}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <BillingPlanManagement billing={data} billingCycle={billingCycle} onChanged={() => void reload()} />
          </section>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t("business.billing.timelineTitle")}</h3>
            <BillingTimeline events={data.events} />
          </section>

          <CommercialInsightsPanel />
        </div>
      ) : null}
    </BusinessSettingsPanelShell>
  );
}
