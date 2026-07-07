import { Link, useLocation, useNavigate } from "react-router";
import { useSyncExternalStore } from "react";
import { Lock, Loader2, X } from "lucide-react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import {
  isAuthLogoutTransitionActive,
  subscribeAuthLogoutTransition,
} from "../../lib/authLogoutTransition";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS,
  DASHBOARD_SIDEBAR_NAV_CLASS,
} from "../CareTipLogo";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import {
  employeeDashboardNavItems,
  isEmployeeDashboardNavActive,
  showEmployeeNavSubscriptionLock,
} from "./employeeDashboardNav";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
import { MobileDrawer } from "../ui/MobileDrawer";
import {
  dashboardSidebarIconButtonIdle,
  dashboardSidebarNavLinkActive,
  dashboardSidebarNavLinkBase,
  dashboardSidebarNavLinkIdle,
  dashboardSidebarSignOutButton,
} from "@/lib/theme/dashboardSidebarUi";

const EMPLOYEE_DASHBOARD_HOME = employeeDashboardNavItems[0]!.href;

type EmployeeMobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  businessBranding?: {
    businessLogo: string | null;
    businessName: string;
  } | null;
};

export function EmployeeMobileSidebar({
  isOpen,
  onClose,
  businessBranding,
}: EmployeeMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const signingOut = useSyncExternalStore(
    subscribeAuthLogoutTransition,
    isAuthLogoutTransitionActive,
    () => false,
  );
  const { tier, ready: entitlementsReady } = useSubscriptionEntitlements({
    enabled: user?.role === "employee",
    role: user?.role === "employee" ? "employee" : null,
  });
  const navItems = employeeDashboardNavItems;

  const venueName = String(businessBranding?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <MobileDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t("shell.header.menuButtonAria")}>
      <div className={DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS}>
        <Link
          to={EMPLOYEE_DASHBOARD_HOME}
          onClick={onClose}
          className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2 rounded-lg pr-2 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          {businessBranding ? (
            <>
              <BusinessLogoMark
                logoPathOrUrl={businessBranding.businessLogo}
                businessName={venueName}
                size="dashboard"
                className="shrink-0"
              />
              <span className="min-w-0 truncate text-xs font-semibold text-sidebar-foreground">{venueName}</span>
            </>
          ) : (
            <>
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="h-3 min-w-0 max-w-[8rem] flex-1 rounded bg-muted animate-pulse" />
            </>
          )}
        </Link>
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

      <nav className={DASHBOARD_SIDEBAR_NAV_CLASS}>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isEmployeeDashboardNavActive(item.href, location.pathname);
            const subscriptionLocked = showEmployeeNavSubscriptionLock(entitlementsReady, item, tier);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "employee-dash-nav-link",
                    dashboardSidebarNavLinkBase,
                    isActive
                      ? cn("employee-dash-nav-link--active", dashboardSidebarNavLinkActive)
                      : dashboardSidebarNavLinkIdle,
                  )}
                >
                  <CareIcon name={item.icon} size="nav" />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate tracking-tight">{t(item.labelKey)}</span>
                    {subscriptionLocked ? (
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 opacity-70"
                        aria-label={t("subscription.nav.lockedAria", { feature: t(item.labelKey) })}
                      />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-4 pb-4 pt-3">
        <button
          type="button"
          disabled={signingOut}
          aria-busy={signingOut}
          onClick={() => {
            if (signingOut) return;
            logout();
            onClose();
          }}
          className={cn("employee-dash-nav-link", dashboardSidebarSignOutButton)}
        >
          <CareIcon name="signOut" size="md" />
          {signingOut ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : null}
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </MobileDrawer>
  );
}
