import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchBillingStatus,
  type BillingStatus,
} from "../lib/api";
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
      setError(toUserFriendlyMessage(err, t("business.billing.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
