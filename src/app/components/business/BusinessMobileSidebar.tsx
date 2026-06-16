import { Link, useLocation, useNavigate } from "react-router";
import { Lock, X } from "lucide-react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import {
  businessDashboardNavItems,
  filterBusinessDashboardNavItems,
  isBusinessDashboardNavActive,
} from "./businessDashboardNav";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
import { MobileDrawer } from "../ui/MobileDrawer";

interface BusinessMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessMobileSidebar({ isOpen, onClose }: BusinessMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, exitImpersonation } = useAuth();
  const { tier } = useSubscriptionEntitlements({
    enabled: user?.role === "business",
    role: user?.role === "business" ? "business" : null,
    cacheOnly: true,
  });
  const navItems = filterBusinessDashboardNavItems(businessDashboardNavItems, tier);
  const qrLocked = user?.status === "PENDING" || user?.status === "REJECTED";

  return (
    <MobileDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t("shell.header.menuButtonAria")}>
      <div
        className={cn(
          "flex items-center justify-between px-6 py-4",
          CARE_TIP_LOGO_SURFACE_CLASS,
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
          <div className="min-w-0">
            <CareTipLogo size="sm" />
          </div>
          <span className="text-xs font-semibold text-sidebar-foreground">
            {t("dashboard.roleLabelBusiness")}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 transition-colors hover:bg-stone-100"
        >
          <X className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isBusinessDashboardNavActive(item.href, location.pathname);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "business-dash-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "business-dash-nav-link--active bg-primary font-semibold text-primary-foreground"
                      : "text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground",
                  )}
                >
                  <CareIcon name={item.icon} size="nav" />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{t(item.labelKey)}</span>
                    {item.href === "/dashboard/qr-code-management" && qrLocked ? (
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 opacity-70"
                        aria-label={t("business.verification.qrNavLocked")}
                      />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 pb-4">
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </MobileDrawer>
  );
}
