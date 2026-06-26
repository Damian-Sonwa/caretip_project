import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { trackGoogleAdsConversion } from "../../../lib/googleAdsConversion";
import { clearBusinessProfileClientCache } from "../../../lib/api";
import { clearSubscriptionTierSession } from "../../../lib/subscriptionSessionCache";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { BusinessModuleWorkspaceHeader } from "../../../components/business/BusinessModuleWorkspaceHeader";
import { billingSubNavItems } from "../../../components/business/businessDashboardNav";

export function BusinessBillingLayout() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (!billing) return;
    if (billing === "success") {
      clearBusinessProfileClientCache();
      clearSubscriptionTierSession();
      toast.success(t("business.billing.checkoutSuccess"));
      trackGoogleAdsConversion("billing_checkout_completed");
    } else if (billing === "canceled") {
      toast.message(t("business.billing.checkoutCanceled"));
    }
    const next = new URLSearchParams(searchParams);
    next.delete("billing");
    next.delete("session_id");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, t]);

  return (
    <div className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="dashboard-page-contained mx-auto w-full max-w-6xl">
        <BusinessModuleWorkspaceHeader
          personality="billing"
          badge={t("business.billing.moduleEyebrow")}
          icon={CreditCard}
          title={t("business.settings.panels.billingTitle")}
          subtitle={t("business.billing.moduleSubtitle")}
        />
        <BusinessModuleSubNav items={billingSubNavItems} ariaLabelKey="business.billing.navAria" />
        <Outlet />
      </div>
    </div>
  );
}
