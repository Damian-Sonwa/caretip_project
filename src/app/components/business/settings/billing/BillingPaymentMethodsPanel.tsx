import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBillingPortalSession } from "../../../../lib/api";
import { toUserFriendlyMessage } from "../../../../lib/errorMessages";
import { Button } from "@/components/ui/button";

const PAYMENT_METHOD_BULLET_KEYS = [
  "business.billing.paymentMethodsBulletAdd",
  "business.billing.paymentMethodsBulletReplace",
  "business.billing.paymentMethodsBulletRemove",
  "business.billing.paymentMethodsBulletUpdate",
] as const;

export function BillingPaymentMethodsPanel() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function openPaymentMethods() {
    setBusy(true);
    try {
      const { url } = await createBillingPortalSession({ flow: "payment_methods" });
      window.location.assign(url);
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.portalError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2 text-sm text-muted-foreground">
        {PAYMENT_METHOD_BULLET_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
      <Button type="button" onClick={() => void openPaymentMethods()} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        <CreditCard className="mr-2 h-4 w-4" aria-hidden />
        {t("business.billing.managePaymentMethods")}
      </Button>
    </div>
  );
}
