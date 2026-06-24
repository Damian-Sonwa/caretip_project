import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { MessageSquareHeart } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { BusinessModuleWorkspaceHeader } from "../../../components/business/BusinessModuleWorkspaceHeader";
import { customersSubNavItems } from "../../../components/business/businessDashboardNav";

export function BusinessCustomersLayout() {
  const { t } = useTranslation();

  return (
    <div className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="dashboard-page-contained mx-auto w-full max-w-6xl">
        <BusinessModuleWorkspaceHeader
          personality="customers"
          badge={t("business.customers.eyebrow")}
          icon={MessageSquareHeart}
          title={t("business.customers.title")}
          subtitle={t("business.customers.subtitle")}
        />
        <BusinessModuleSubNav items={customersSubNavItems} ariaLabelKey="business.customers.navAria" />
        <Outlet />
      </div>
    </div>
  );
}
