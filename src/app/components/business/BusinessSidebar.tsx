import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import {
  businessDashboardNavItems,
  isBusinessDashboardNavActive,
} from "./businessDashboardNav";

export function BusinessSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, exitImpersonation } = useAuth();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200/80 lg:bg-gradient-to-b lg:from-white lg:to-stone-50/95 lg:text-sidebar-foreground"
    >
      <div className={cn("px-6 py-4", CARE_TIP_LOGO_SURFACE_CLASS)}>
        <CareTipLogo size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-0.5">
          {businessDashboardNavItems.map((item) => {
            const isActive = isBusinessDashboardNavActive(item.href, location.pathname);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "business-dash-nav-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "business-dash-nav-link--active bg-primary font-semibold text-primary-foreground"
                      : "text-sidebar-foreground/85 hover:bg-stone-100/90 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
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
            if (user?.impersonation) {
              exitImpersonation();
              navigate("/platform-admin/dashboard", { replace: true });
              return;
            }
            logout();
            navigate("/business/login", { replace: true });
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
