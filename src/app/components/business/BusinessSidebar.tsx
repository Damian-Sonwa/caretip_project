import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { fetchBusinessProfile, type BusinessInfo } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import { BusinessLogoMark } from "./BusinessLogoMark";
import {
  businessDashboardNavItems,
  isBusinessDashboardNavActive,
} from "./businessDashboardNav";

export function BusinessSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, exitImpersonation } = useAuth();
  const [profile, setProfile] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    if (!user?.businessId || user.role !== "business") return;
    let cancelled = false;
    const load = () => {
      void fetchBusinessProfile()
        .then((p) => {
          if (!cancelled) setProfile(p);
        })
        .catch((e) => {
          logClientError("BusinessSidebar", e);
          if (!cancelled) setProfile(null);
        });
    };
    load();
    const onProfileChanged = () => load();
    window.addEventListener("caretip-business-profile-changed", onProfileChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("caretip-business-profile-changed", onProfileChanged);
    };
  }, [user?.businessId, user?.role]);

  const venueName =
    String(profile?.name ?? user?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200/80 lg:bg-gradient-to-b lg:from-white lg:to-stone-50/95 lg:text-sidebar-foreground"
    >
      <div
        className={cn(
          "flex flex-col gap-3 px-6 py-4",
          CARE_TIP_LOGO_SURFACE_CLASS,
        )}
      >
        <div className="min-w-0">
          <CareTipLogo size="sm" />
        </div>
        <div className="flex min-w-0 items-start gap-3">
          <BusinessLogoMark
            logoPathOrUrl={profile?.logo}
            businessName={venueName}
            size="header"
            rounded="rounded-xl"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{venueName}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.businessDashboardSubtitle")}</p>
          </div>
        </div>
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

      <div className="border-t border-sidebar-border p-4">
        <Link
          to="/dashboard/profile-settings"
          className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5 transition-colors hover:bg-muted/80"
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
  );
}
