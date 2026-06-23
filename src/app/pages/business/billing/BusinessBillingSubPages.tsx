import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBillingStatus } from "../../../hooks/useBillingStatus";
import { createBillingPortalSession } from "../../../lib/api";
import { toUserFriendlyMessage } from "../../../lib/errorMessages";
import { BillingTimeline } from "../../../components/business/settings/billing/BillingTimeline";
import { BusinessSettingsPanelShell } from "../../../components/business/settings/BusinessSettingsPanelShell";
import { Button } from "@/components/ui/button";

export function BusinessBillingHistoryPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useBillingStatus();

  return (
    <BusinessSettingsPanelShell
      title={t("business.billing.nav.history")}
      description={t("business.billing.historyDesc")}
    >
      {loading ? (
        <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : data ? (
        <BillingTimeline events={data.events} />
      ) : null}
    </BusinessSettingsPanelShell>
  );
}

export function BusinessBillingInvoicesPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function openPortal() {
    setBusy(true);
    try {
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.portalError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <BusinessSettingsPanelShell
      title={t("business.billing.nav.invoices")}
      description={t("business.billing.invoicesDesc")}
    >
      <p className="mb-4 text-sm text-muted-foreground">{t("business.billing.invoicesHint")}</p>
      <Button type="button" variant="outline" onClick={() => void openPortal()} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("business.billing.openStripePortal")}
      </Button>
    </BusinessSettingsPanelShell>
  );
}

export function BusinessBillingPaymentMethodsPage() {
  return <BusinessBillingInvoicesPage />;
}
