import { Link, useLocation } from "react-router";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "./CareTipLogo";
import { CareIcon } from "@/components/icons";
import { dashboardShellNavItems } from "./dashboardShellNav";
import { MobileDrawer } from "./ui/MobileDrawer";

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
    <MobileDrawer isOpen={isOpen} onClose={onClose}>
      <div className={cn("flex items-center justify-between px-6 py-4", CARE_TIP_LOGO_SURFACE_CLASS)}>
        <div className="flex min-w-0 items-center gap-2">
          <CareTipLogo size="sm" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 transition-colors hover:bg-stone-100"
        >
          <X className="h-5 w-5 text-sidebar-foreground" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {dashboardShellNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-primary font-semibold text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <CareIcon name={item.icon} size="md" />
                  <span className="text-sm font-medium">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-200/70 p-4">
        <Link
          to="/dashboard/settings"
          onClick={onClose}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name || t("dashboard.managerFallback")}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>
        </Link>
      </div>
    </MobileDrawer>
  );
}
