import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "./CareTipLogo";
import { dashboardShellNavItems } from "./dashboardShellNav";

interface DashboardMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardMobileSidebar({ isOpen, onClose }: DashboardMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();

  const initial =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, type: "tween" }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border lg:hidden flex flex-col"
          >
            <div className={cn("flex items-center justify-between px-6 py-5", CARE_TIP_LOGO_SURFACE_CLASS)}>
              <div className="flex min-w-0 items-center gap-2">
                <CareTipLogo size="sm" />
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {dashboardShellNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-border p-4">
              <Link
                to="/dashboard/profile-settings"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name || t("dashboard.managerFallback")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
