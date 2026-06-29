import { useBillingStatus } from "../../../hooks/useBillingStatus";
import { BillingHistoryPanel } from "../../../components/business/settings/billing/BillingHistoryPanel";
import { BillingInvoicesPanel } from "../../../components/business/settings/billing/BillingInvoicesPanel";
import { BillingPaymentMethodsPanel } from "../../../components/business/settings/billing/BillingPaymentMethodsPanel";
import { BusinessSettingsPanelShell } from "../../../components/business/settings/BusinessSettingsPanelShell";

export function BusinessBillingHistoryPage() {
  const { data, loading, error, reload } = useBillingStatus();

  return (
    <BusinessSettingsPanelShell embedded>
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
  return (
    <BusinessSettingsPanelShell embedded>
      <BillingInvoicesPanel />
    </BusinessSettingsPanelShell>
  );
}

export function BusinessBillingPaymentMethodsPage() {
  return (
    <BusinessSettingsPanelShell embedded>
      <BillingPaymentMethodsPanel />
    </BusinessSettingsPanelShell>
  );
}
