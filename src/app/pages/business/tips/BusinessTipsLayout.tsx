import { Outlet, useLocation } from "react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coins } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { BusinessModuleWorkspaceHeader } from "../../../components/business/BusinessModuleWorkspaceHeader";
import { tipsSubNavItems } from "../../../components/business/businessDashboardNav";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";
import { businessUi } from "@/app/components/business/businessDashboardUi";

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
    <div className={businessUi.modulePageShell}>
      <div className={businessUi.modulePageContained}>
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
