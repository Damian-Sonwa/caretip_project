import type { LucideIcon } from "lucide-react";
import {
  Bell,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  QrCode,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export const BUSINESS_DASHBOARD_HOME_HREF = "/dashboard" as const;

export type BusinessDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const businessDashboardNavItems: readonly BusinessDashboardNavItem[] = [
  { labelKey: "dashboardNav.business.overview", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "dashboardNav.business.team", href: "/dashboard/staff-management", icon: Users },
  { labelKey: "dashboardNav.business.qrCodes", href: "/dashboard/qr-code-management", icon: QrCode },
  { labelKey: "dashboardNav.business.locations", href: "/dashboard/locations", icon: MapPin },
  { labelKey: "dashboardNav.business.tables", href: "/dashboard/tables", icon: LayoutGrid },
  { labelKey: "dashboardNav.business.tipsActivity", href: "/dashboard/transactions", icon: Wallet },
  { labelKey: "dashboardNav.business.notifications", href: "/dashboard/notifications", icon: Bell },
  { labelKey: "dashboardNav.business.settings", href: "/dashboard/settings", icon: Settings },
] as const;

const BUSINESS_SETTINGS_LEGACY_PATHS = ["/dashboard/profile", "/dashboard/profile-settings"] as const;

export function isBusinessDashboardNavActive(href: string, pathname: string): boolean {
  if (href === BUSINESS_DASHBOARD_HOME_HREF) return pathname === BUSINESS_DASHBOARD_HOME_HREF;
  if (href === "/dashboard/settings") {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      (BUSINESS_SETTINGS_LEGACY_PATHS as readonly string[]).includes(pathname)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
