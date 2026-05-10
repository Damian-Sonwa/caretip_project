import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogOut, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import {
  businessDashboardNavItems,
  isBusinessDashboardNavActive,
} from "./businessDashboardNav";

interface BusinessMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessMobileSidebar({ isOpen, onClose }: BusinessMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, exitImpersonation } = useAuth();

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
                className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5 text-sidebar-foreground" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {businessDashboardNavItems.map((item) => {
                  const isActive = isBusinessDashboardNavActive(item.href, location.pathname);
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
                  if (user?.impersonation) {
                    exitImpersonation();
                    onClose();
                    navigate("/platform-admin/dashboard", { replace: true });
                    return;
                  }
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
              <Link
                to="/dashboard/profile-settings"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {(user?.name?.trim().charAt(0) ?? "U").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.name || t("dashboard.managerFallback")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
