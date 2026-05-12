import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogOut, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import { BusinessLogoMark } from "../business/BusinessLogoMark";
import { employeeDashboardNavItems, isEmployeeDashboardNavActive } from "./employeeDashboardNav";

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
  const { user, logout } = useAuth();

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
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden"
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
                  size="sm"
                  rounded="rounded-lg"
                  className="shrink-0"
                />
                <span className="min-w-0 truncate text-xs font-semibold text-sidebar-foreground">{venueName}</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5 text-sidebar-foreground" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {employeeDashboardNavItems.map((item) => {
                  const isActive = isEmployeeDashboardNavActive(item.href, location.pathname);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary font-semibold text-primary-foreground shadow-md"
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
                  onClose();
                  navigate("/login", { replace: true });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">{t("dashboard.signOut")}</span>
              </button>
            </div>

            <div className="border-t border-sidebar-border p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name || t("dashboard.teamMemberFallback")}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

