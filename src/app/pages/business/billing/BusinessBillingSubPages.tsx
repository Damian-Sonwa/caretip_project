import { useTranslation } from "react-i18next";
import { useBillingStatus } from "../../../hooks/useBillingStatus";
import { BillingHistoryPanel } from "../../../components/business/settings/billing/BillingHistoryPanel";
import { BillingInvoicesPanel } from "../../../components/business/settings/billing/BillingInvoicesPanel";
import { BillingPaymentMethodsPanel } from "../../../components/business/settings/billing/BillingPaymentMethodsPanel";
import { BusinessSettingsPanelShell } from "../../../components/business/settings/BusinessSettingsPanelShell";

export function BusinessBillingHistoryPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useBillingStatus();

  return (
    <BusinessSettingsPanelShell
      title={t("business.billing.nav.history")}
      description={t("business.billing.historyDesc")}
    >
      <BillingHistoryPanel
        loading={loading}
        error={error}
        events={data?.events ?? null}
        onRetry={() => void reload()}
      />
    </BusinessSettingsPanelShell>
  );
}

export function BusinessBillingInvoicesPage() {
  const { t } = useTranslation();

  return (
    <BusinessSettingsPanelShell
      title={t("business.billing.nav.invoices")}
      description={t("business.billing.invoicesDesc")}
    >
      <BillingInvoicesPanel />
    </BusinessSettingsPanelShell>
  );
}

export function BusinessBillingPaymentMethodsPage() {
  const { t } = useTranslation();

  return (
    <BusinessSettingsPanelShell
      title={t("business.billing.nav.paymentMethods")}
      description={t("business.billing.paymentMethodsDesc")}
    >
      <BillingPaymentMethodsPanel />
    </BusinessSettingsPanelShell>
  );
}
