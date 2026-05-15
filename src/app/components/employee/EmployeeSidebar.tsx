import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import { employeeDashboardNavItems, isEmployeeDashboardNavActive } from "./employeeDashboardNav";

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
  const { user, logout } = useAuth();

  const venueName =
    String(businessBranding?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar lg:text-sidebar-foreground"
    >
      <div className={cn("flex flex-col gap-3 px-6 py-4", CARE_TIP_LOGO_SURFACE_CLASS)}>
        <Link
          to={EMPLOYEE_DASHBOARD_HOME}
          className="flex min-w-0 items-start gap-3 rounded-lg outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <BusinessLogoMark
            logoPathOrUrl={businessBranding?.businessLogo ?? null}
            businessName={venueName}
            size="md"
            rounded="rounded-xl"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{venueName}</p>
          </div>
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {user?.name || t("dashboard.teamMemberFallback")}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {employeeDashboardNavItems.map((item) => {
            const isActive = isEmployeeDashboardNavActive(item.href, location.pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{t(item.labelKey)}</span>
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
        </button>
      </div>
    </motion.aside>
  );
}

