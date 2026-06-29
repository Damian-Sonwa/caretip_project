import { useNavigate } from "react-router";
import { X } from "lucide-react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  CareTipLogo,
  DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS,
  DASHBOARD_SIDEBAR_NAV_CLASS,
} from "../CareTipLogo";
import { BusinessSidebarNavShell } from "./sidebar/BusinessSidebarNavShell";
import { BusinessSidebarUpgradeCta } from "./sidebar/BusinessSidebarUpgradeCta";
import { MobileDrawer } from "../ui/MobileDrawer";
import { dashboardSidebarIconButtonIdle, dashboardSidebarSignOutButton } from "@/lib/theme/dashboardSidebarUi";

interface BusinessMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessMobileSidebar({ isOpen, onClose }: BusinessMobileSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, exitImpersonation } = useAuth();

  return (
    <MobileDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t("shell.header.menuButtonAria")}>
      <div className={DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS}>
        <div className="min-w-0 flex-1">
          <CareTipLogo size="drawer" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "touch-manipulation inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5",
            dashboardSidebarIconButtonIdle,
          )}
        >
          <X className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      <nav
        className={cn(
          DASHBOARD_SIDEBAR_NAV_CLASS,
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-0",
        )}
      >
        <BusinessSidebarNavShell onNavigate={onClose} />
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-3 pt-2 pb-4">
        <BusinessSidebarUpgradeCta />
        <button
          type="button"
          onClick={() => {
            if (user?.impersonation) {
              void exitImpersonation();
              onClose();
              return;
            }
            logout();
            onClose();
            navigate("/business/login", { replace: true });
          }}
          className={dashboardSidebarSignOutButton}
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </MobileDrawer>
  );
}
