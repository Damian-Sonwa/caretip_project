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
  name: string;
  href: string;
  icon: LucideIcon;
};

export const businessDashboardNavItems: readonly BusinessDashboardNavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Team", href: "/dashboard/staff-management", icon: Users },
  { name: "QR codes", href: "/dashboard/qr-code-management", icon: QrCode },
  { name: "Locations", href: "/dashboard/locations", icon: MapPin },
  { name: "Tables", href: "/dashboard/tables", icon: LayoutGrid },
  { name: "Tips & activity", href: "/dashboard/transactions", icon: Wallet },
  { name: "Venue profile", href: "/dashboard/profile", icon: Building2 },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Account settings", href: "/dashboard/profile-settings", icon: UserCircle },
] as const;

export function isBusinessDashboardNavActive(href: string, pathname: string): boolean {
  if (href === BUSINESS_DASHBOARD_HOME_HREF) return pathname === BUSINESS_DASHBOARD_HOME_HREF;
  return pathname === href || pathname.startsWith(`${href}/`);
}
