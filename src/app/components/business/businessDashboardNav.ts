import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  QrCode,
  UserCircle,
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
  { labelKey: "dashboardNav.business.venueProfile", href: "/dashboard/profile", icon: Building2 },
  { labelKey: "dashboardNav.business.notifications", href: "/dashboard/notifications", icon: Bell },
  { labelKey: "dashboardNav.business.accountSettings", href: "/dashboard/profile-settings", icon: UserCircle },
] as const;

export function isBusinessDashboardNavActive(href: string, pathname: string): boolean {
  if (href === BUSINESS_DASHBOARD_HOME_HREF) return pathname === BUSINESS_DASHBOARD_HOME_HREF;
  return pathname === href || pathname.startsWith(`${href}/`);
}
