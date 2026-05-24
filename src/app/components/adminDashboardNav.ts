import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

export const PLATFORM_ADMIN_DASHBOARD_HREF = "/platform-admin/dashboard" as const;

export type AdminDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

/** Shared platform admin nav — desktop sidebar and mobile drawer must use this list. */
export const adminDashboardNavItems: readonly AdminDashboardNavItem[] = [
  { labelKey: "admin.sidebar.navOverview", href: PLATFORM_ADMIN_DASHBOARD_HREF, icon: LayoutDashboard },
  { labelKey: "admin.sidebar.navBusinesses", href: "/platform-admin/businesses", icon: Building2 },
  { labelKey: "admin.sidebar.navTransactions", href: "/platform-admin/transactions", icon: CreditCard },
  { labelKey: "admin.sidebar.navLogs", href: "/platform-admin/logs", icon: FileText },
  { labelKey: "admin.sidebar.navAnnouncements", href: "/platform-admin/announcements", icon: Megaphone },
  { labelKey: "admin.sidebar.navNotifications", href: "/platform-admin/notifications", icon: Bell },
  { labelKey: "admin.sidebar.navSettings", href: "/platform-admin/settings", icon: Settings },
  { labelKey: "admin.sidebar.navUsers", href: "/platform-admin/users", icon: Users },
] as const;

export function isAdminDashboardNavActive(href: string, pathname: string): boolean {
  if (href === PLATFORM_ADMIN_DASHBOARD_HREF) {
    return pathname === PLATFORM_ADMIN_DASHBOARD_HREF;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
