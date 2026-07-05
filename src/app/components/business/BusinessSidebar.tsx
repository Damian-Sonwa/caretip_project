import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CareIcon } from "@/components/icons";
import { useAuth } from "../../hooks/useAuth";
import { CareTipLogo, DASHBOARD_SIDEBAR_BRAND_CLASS, DASHBOARD_SIDEBAR_NAV_CLASS } from "../CareTipLogo";
import { BusinessSidebarNavShell } from "./sidebar/BusinessSidebarNavShell";
import { BusinessSidebarUpgradeCta } from "./sidebar/BusinessSidebarUpgradeCta";
import { DASHBOARD_SIDEBAR_SHELL_CLASS, dashboardSidebarSignOutButton } from "@/lib/theme/dashboardSidebarUi";
import { cn } from "@/lib/utils";

export function BusinessSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, exitImpersonation } = useAuth();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("business-sidebar", DASHBOARD_SIDEBAR_SHELL_CLASS)}
    >
      <div className={DASHBOARD_SIDEBAR_BRAND_CLASS}>
        <CareTipLogo size="sidebar" />
      </div>

      <nav className={cn(DASHBOARD_SIDEBAR_NAV_CLASS, "min-h-0 flex-1 overflow-y-auto overscroll-contain px-0")}>
        <BusinessSidebarNavShell />
      </nav>

      <div className="mt-auto shrink-0 border-t border-sidebar-border px-3 pt-2 pb-4">
        <BusinessSidebarUpgradeCta />
        <button
          type="button"
          onClick={() => {
            if (user?.impersonation) {
              void exitImpersonation();
              return;
            }
            logout();
            navigate("/business/login", { replace: true });
          }}
          className={dashboardSidebarSignOutButton}
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </motion.aside>
  );
}
