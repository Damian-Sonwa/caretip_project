import { Outlet, useLocation } from "react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coins } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { BusinessModuleWorkspaceHeader } from "../../../components/business/BusinessModuleWorkspaceHeader";
import { tipsSubNavItems } from "../../../components/business/businessDashboardNav";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";

export function BusinessTipsLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const header = useMemo(() => {
    if (pathname.includes("/analytics")) {
      return {
        personality: "analytics" as HeroPersonality,
        subtitle: t("business.tips.analyticsHeaderSubtitle"),
      };
    }
    return {
      personality: "tips" as HeroPersonality,
      subtitle: t("business.tips.subtitle"),
    };
  }, [pathname, t]);

  return (
    <div className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="dashboard-page-contained mx-auto w-full max-w-6xl">
        <BusinessModuleWorkspaceHeader
          personality={header.personality}
          badge={t("business.tips.eyebrow")}
          icon={Coins}
          title={t("business.tips.title")}
          subtitle={header.subtitle}
        />
        <BusinessModuleSubNav items={tipsSubNavItems} ariaLabelKey="business.tips.navAria" />
        <Outlet />
      </div>
    </div>
  );
}
