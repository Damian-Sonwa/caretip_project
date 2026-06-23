import { useState } from "react";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createBillingCheckoutSession, fetchBillingStatus } from "@/app/lib/api";
import { toUserFriendlyMessage } from "@/app/lib/errorMessages";
import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { getFeatureCatalog } from "@/app/lib/subscriptionFeatureCatalog";
import { cn } from "@/lib/utils";

type UpgradeCtaProps = {
  featureKey?: FeatureKey;
  className?: string;
  variant?: "primary" | "secondary" | "link";
  fullWidth?: boolean;
};

export function UpgradeCta({
  featureKey,
  className,
  variant = "primary",
  fullWidth = false,
}: UpgradeCtaProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const requiredTier = featureKey ? getFeatureCatalog(featureKey).requiredTier : "premium";

  const baseClass = cn(
    "inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-60",
    fullWidth && "w-full",
    variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "secondary" &&
      "border border-border bg-background text-foreground hover:bg-muted/50",
    variant === "link" && "min-h-0 px-0 text-primary underline-offset-4 hover:underline",
    className,
  );

  async function handleUpgrade() {
    if (requiredTier === "enterprise") {
      window.location.assign("/contact?intent=demo");
      return;
    }
    setBusy(true);
    try {
      const billing = await fetchBillingStatus();
      if (billing?.billingEnabled && billing.stripeConfigured) {
        const session = await createBillingCheckoutSession({
          planKey: "premium",
          billingCycle: billing.billingCycle ?? "monthly",
        });
        if (session.url) {
          window.location.assign(session.url);
          return;
        }
        toast.error(t("business.billing.checkoutNoUrl"));
        return;
      }
      window.location.assign("/dashboard/billing/subscription");
    } catch (err) {
      toast.error(toUserFriendlyMessage(err) || t("business.billing.checkoutError"));
    } finally {
      setBusy(false);
    }
  }

  const label =
    requiredTier === "enterprise"
      ? t("subscription.upgrade.contactSales")
      : t("subscription.upgrade.upgradeToPremium");

  if (requiredTier === "enterprise") {
    return (
      <Link to="/contact?intent=demo" className={baseClass}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={baseClass} disabled={busy} onClick={() => void handleUpgrade()}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {label}
    </button>
  );
}
