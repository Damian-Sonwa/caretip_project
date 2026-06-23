import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Crown, QrCode, Sparkles } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { qrStudioSubNavItems, isBusinessNavItemLocked } from "../../../components/business/businessDashboardNav";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";
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
    <div className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div
        className={cn(
          "dashboard-page-contained mx-auto w-full",
          isBrandingStudio ? "max-w-7xl" : "max-w-6xl",
        )}
      >
        <header className={premiumVisualClasses.workspaceHeader}>
          <div className="premium-workspace-header__glow" aria-hidden />
          <div className="premium-workspace-header__inner">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={premiumVisualClasses.badge}>
                <Crown className="h-3 w-3" aria-hidden />
                {t("premium.qrStudio.badge")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-[#EB992C]" aria-hidden />
                {t("premium.qrStudio.feature")}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <QrCode className="h-5 w-5 text-[#EB992C]" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {t("business.qrStudio.title")}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/75">{t("business.qrStudio.subtitle")}</p>
              </div>
            </div>
          </div>
        </header>
        <BusinessModuleSubNav items={subItems} ariaLabelKey="business.qrStudio.navAria" />
        <Outlet key={pathname} />
      </div>
    </div>
  );
}
