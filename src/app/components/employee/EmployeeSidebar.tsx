import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { CareIcon } from "@/components/icons";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_SIDEBAR_BRAND_CLASS,
  DASHBOARD_SIDEBAR_NAV_CLASS,
} from "../CareTipLogo";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import {
  employeeDashboardNavItems,
  isEmployeeDashboardNavActive,
  isEmployeeNavItemLocked,
} from "./employeeDashboardNav";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";

const EMPLOYEE_DASHBOARD_HOME = employeeDashboardNavItems[0]!.href;

type EmployeeBusinessBranding = {
  businessLogo: string | null;
  businessName: string;
};

export function EmployeeSidebar({
  businessBranding,
}: {
  businessBranding?: EmployeeBusinessBranding | null;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { tier } = useSubscriptionEntitlements({
    enabled: user?.role === "employee",
    role: user?.role === "employee" ? "employee" : null,
  });
  const navItems = employeeDashboardNavItems;

  const venueName =
    String(businessBranding?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200/80 lg:bg-gradient-to-b lg:from-white lg:to-stone-50/95 lg:text-sidebar-foreground"
    >
      <div className={DASHBOARD_SIDEBAR_BRAND_CLASS}>
        <Link
          to={EMPLOYEE_DASHBOARD_HOME}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <BusinessLogoMark
            logoPathOrUrl={businessBranding?.businessLogo ?? null}
            businessName={venueName}
            size="dashboard"
            className="shrink-0"
          />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-sidebar-foreground">
            {venueName}
          </p>
        </Link>
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
                  className={cn(
                    "employee-dash-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "employee-dash-nav-link--active bg-primary font-semibold text-primary-foreground"
                      : "text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground",
                  )}
                >
                  <CareIcon name={item.icon} size="nav" />
                  <span className="flex min-w-0 flex-1 items-center gap-2 tracking-tight">
                    <span className="truncate">{t(item.labelKey)}</span>
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
            navigate("/employee/login", { replace: true });
          }}
          className="employee-dash-nav-link flex w-full items-center gap-3 px-3 py-2.5 text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground"
        >
          <CareIcon name="signOut" size="md" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </motion.aside>
  );
}

