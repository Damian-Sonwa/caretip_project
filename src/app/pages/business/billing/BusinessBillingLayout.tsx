import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { billingSubNavItems } from "../../../components/business/businessDashboardNav";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { cn } from "@/lib/utils";

export function BusinessBillingLayout() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (!billing) return;
    if (billing === "success") {
      toast.success(t("business.billing.checkoutSuccess"));
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
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {t("business.billing.moduleEyebrow")}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("business.settings.panels.billingTitle")}
          </h1>
          <p className={cn("mt-2 max-w-2xl text-sm", businessUi.cardDesc)}>
            {t("business.settings.panels.billingDesc")}
          </p>
        </header>
        <BusinessModuleSubNav items={billingSubNavItems} ariaLabelKey="business.billing.navAria" />
        <Outlet />
      </div>
    </div>
  );
}
