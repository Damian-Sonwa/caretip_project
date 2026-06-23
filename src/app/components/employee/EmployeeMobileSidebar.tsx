import { Link, useLocation, useNavigate } from "react-router";
import { Lock, X } from "lucide-react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS,
  DASHBOARD_SIDEBAR_NAV_CLASS,
} from "../CareTipLogo";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import {
  employeeDashboardNavItems,
  isEmployeeDashboardNavActive,
  isEmployeeNavItemLocked,
} from "./employeeDashboardNav";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
import { MobileDrawer } from "../ui/MobileDrawer";

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
  const { tier } = useSubscriptionEntitlements({
    enabled: user?.role === "employee",
    role: user?.role === "employee" ? "employee" : null,
    cacheOnly: true,
  });
  const navItems = employeeDashboardNavItems;

  const venueName = String(businessBranding?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <MobileDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t("shell.header.menuButtonAria")}>
      <div className={DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS}>
        <Link
          to={EMPLOYEE_DASHBOARD_HOME}
          onClick={onClose}
          className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2 rounded-lg pr-2 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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
              <div className="h-9 w-9 shrink-0 rounded-lg bg-muted animate-pulse" />
              <div className="h-3 min-w-0 flex-1 max-w-[8rem] rounded bg-muted animate-pulse" />
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 transition-colors hover:bg-stone-100"
        >
          <X className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      <nav className={DASHBOARD_SIDEBAR_NAV_CLASS}>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isEmployeeDashboardNavActive(item.href, location.pathname);
            const subscriptionLocked = isEmployeeNavItemLocked(item, tier);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "employee-dash-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "employee-dash-nav-link--active bg-primary font-semibold text-primary-foreground"
                      : "text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground",
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

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => {
            logout();
            onClose();
            navigate("/employee/login", { replace: true });
          }}
          className="employee-dash-nav-link flex w-full items-center gap-3 px-3 py-2.5 text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground"
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </MobileDrawer>
  );
}
