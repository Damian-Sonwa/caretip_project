import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { X } from "lucide-react";
import { CareIcon } from "@/components/icons";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import {
  employeeDashboardNavItems,
  filterEmployeeDashboardNavItems,
  isEmployeeDashboardNavActive,
} from "./employeeDashboardNav";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";

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
  });
  const navItems = filterEmployeeDashboardNavItems(employeeDashboardNavItems, tier);

  const venueName = String(businessBranding?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] max-w-[85vw] flex-col border-r border-neutral-200/80 bg-gradient-to-b from-white to-stone-50/95 text-sidebar-foreground shadow-xl lg:hidden"
          >
            <div className={cn("flex items-center justify-between px-6 py-4", CARE_TIP_LOGO_SURFACE_CLASS)}>
              <Link
                to={EMPLOYEE_DASHBOARD_HOME}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg pr-2 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              >
                <BusinessLogoMark
                  logoPathOrUrl={businessBranding?.businessLogo ?? null}
                  businessName={venueName}
                  size="dashboard"
                  className="shrink-0"
                />
                <span className="min-w-0 truncate text-xs font-semibold text-sidebar-foreground">{venueName}</span>
              </Link>
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
                  const isActive = isEmployeeDashboardNavActive(item.href, location.pathname);
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
                        <span className="tracking-tight">{t(item.labelKey)}</span>
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

