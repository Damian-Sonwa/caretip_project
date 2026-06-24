import { Link, Outlet, useLocation } from "react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { BusinessModuleWorkspaceHeader } from "../../../components/business/BusinessModuleWorkspaceHeader";
import { isBusinessNavItemLocked, teamSubNavItems } from "../../../components/business/businessDashboardNav";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { Button } from "@/components/ui/button";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { cn } from "@/lib/utils";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";

export function BusinessTeamLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useRequireAuth();
  const { tier } = useSubscriptionEntitlements({
    enabled: user?.role === "business",
    role: user?.role === "business" ? "business" : null,
  });

  const subItems = teamSubNavItems.map((item) => ({
    ...item,
    locked: "featureKey" in item && item.featureKey ? isBusinessNavItemLocked(item, tier) : false,
  }));

  const header = useMemo(() => {
    if (pathname.includes("/performance")) {
      return {
        personality: "performance" as HeroPersonality,
        subtitle: t("business.team.performance.headerSubtitle"),
      };
    }
    if (pathname.includes("/top-performers")) {
      return {
        personality: "team" as HeroPersonality,
        subtitle: t("business.team.topPerformersHeaderSubtitle"),
      };
    }
    return {
      personality: "employees" as HeroPersonality,
      subtitle: t("business.team.employeesHeaderSubtitle"),
    };
  }, [pathname, t]);

  return (
    <div className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="dashboard-page-contained mx-auto w-full max-w-6xl">
        <div className={cn(businessUi.subPageBreadcrumb, "mb-3 max-lg:mb-2.5")}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">{t("business.staffPage.backAria")}</Link>
          </Button>
        </div>
        <BusinessModuleWorkspaceHeader
          personality={header.personality}
          badge={t("business.team.eyebrow")}
          icon={Users}
          title={t("business.team.title")}
          subtitle={header.subtitle}
        />
        <BusinessModuleSubNav items={subItems} ariaLabelKey="business.team.navAria" />
        <Outlet />
      </div>
    </div>
  );
}
