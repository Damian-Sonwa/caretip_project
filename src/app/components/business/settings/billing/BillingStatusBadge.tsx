import { useTranslation } from "react-i18next";
import type { SubscriptionStatus } from "../../../../lib/api";
import { billingStatusStyles } from "./billingUi";

export function BillingStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { t } = useTranslation();
  const styles = billingStatusStyles(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden />
      {t(`business.billing.status.${status}`)}
    </span>
  );
}
