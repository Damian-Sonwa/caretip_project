import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { Coins } from "lucide-react";
import { BusinessModuleSubNav } from "../../../components/business/BusinessModuleSubNav";
import { tipsSubNavItems } from "../../../components/business/businessDashboardNav";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { cn } from "@/lib/utils";

export function BusinessTipsLayout() {
  const { t } = useTranslation();

  return (
    <div className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="dashboard-page-contained mx-auto w-full max-w-6xl">
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Coins className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">{t("business.tips.eyebrow")}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("business.tips.title")}
          </h1>
          <p className={cn("mt-2 max-w-2xl text-sm", businessUi.cardDesc)}>{t("business.tips.subtitle")}</p>
        </header>
        <BusinessModuleSubNav items={tipsSubNavItems} ariaLabelKey="business.tips.navAria" />
        <Outlet />
      </div>
    </div>
  );
}
