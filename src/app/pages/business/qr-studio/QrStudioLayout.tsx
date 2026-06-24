import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { QrCode, Sparkles } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { BusinessModuleWorkspaceHeader } from "../../../components/business/BusinessModuleWorkspaceHeader";
import { qrStudioSubNavItems, isBusinessNavItemLocked } from "../../../components/business/businessDashboardNav";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { cn } from "@/lib/utils";

export function QrStudioLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useRequireAuth();
  const { tier } = useSubscriptionEntitlements({
    enabled: user?.role === "business",
    role: user?.role === "business" ? "business" : null,
  });

  const subItems = qrStudioSubNavItems.map((item) => ({
    ...item,
    locked: "featureKey" in item && item.featureKey ? isBusinessNavItemLocked(item, tier) : false,
  }));

  const isBrandingStudio = pathname.includes("/qr-studio/branding");

  return (
    <div className="min-w-0 w-full overflow-x-clip bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div
        className={cn(
          "dashboard-page-contained mx-auto min-w-0 w-full max-w-full",
          isBrandingStudio ? "max-w-7xl" : "max-w-6xl",
        )}
      >
        <BusinessModuleWorkspaceHeader
          personality="qrStudio"
          badge={t("premium.qrStudio.badge")}
          feature={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t("premium.qrStudio.feature")}
            </span>
          }
          icon={QrCode}
          title={t("business.qrStudio.title")}
          subtitle={t("business.qrStudio.subtitle")}
        />
        <BusinessModuleSubNav items={subItems} ariaLabelKey="business.qrStudio.navAria" />
        <Outlet key={pathname} />
      </div>
    </div>
  );
}
