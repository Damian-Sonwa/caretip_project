import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CareIcon } from "@/components/icons";
import { useAuth } from "../../hooks/useAuth";
import { CareTipLogo, DASHBOARD_SIDEBAR_BRAND_CLASS, DASHBOARD_SIDEBAR_NAV_CLASS } from "../CareTipLogo";
import { BusinessSidebarNavShell } from "./sidebar/BusinessSidebarNavShell";
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
      className="business-sidebar hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200/80 lg:bg-gradient-to-b lg:from-white lg:to-stone-50/95 lg:text-sidebar-foreground"
    >
      <div className={DASHBOARD_SIDEBAR_BRAND_CLASS}>
        <CareTipLogo size="sm" />
      </div>

      <nav className={cn(DASHBOARD_SIDEBAR_NAV_CLASS, "min-h-0 flex-1 overflow-y-auto overscroll-contain px-0")}>
        <BusinessSidebarNavShell />
      </nav>

      <div className="shrink-0 px-4 pb-4">
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </motion.aside>
  );
}
