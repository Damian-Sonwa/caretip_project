import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchBillingStatus,
  type BillingStatus,
} from "../lib/api";
import { BILLING_CHECKOUT_SYNCED_EVENT } from "../lib/billingCheckoutSuccessSync";
import { toUserFriendlyMessage } from "../lib/errorMessages";

export function useBillingStatus() {
  const { t } = useTranslation();
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await fetchBillingStatus();
      setData(status);
    } catch (err) {
      setError(toUserFriendlyMessage(err) || t("business.billing.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onSynced = () => {
      void reload();
    };
    window.addEventListener(BILLING_CHECKOUT_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(BILLING_CHECKOUT_SYNCED_EVENT, onSynced);
  }, [reload]);

  return { data, loading, error, reload };
}
