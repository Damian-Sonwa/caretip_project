import type { CareIconName } from "@/components/icons";

export const PLATFORM_ADMIN_DASHBOARD_HREF = "/platform-admin/dashboard" as const;

export type AdminDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: CareIconName;
};

/** Shared platform admin nav — desktop sidebar and mobile drawer must use this list. */
export const adminDashboardNavItems: readonly AdminDashboardNavItem[] = [
  { labelKey: "admin.sidebar.navOverview", href: PLATFORM_ADMIN_DASHBOARD_HREF, icon: "overview" },
  { labelKey: "admin.sidebar.navBusinesses", href: "/platform-admin/businesses", icon: "businesses" },
  { labelKey: "admin.sidebar.navTransactions", href: "/platform-admin/transactions", icon: "transactions" },
  { labelKey: "admin.sidebar.navLogs", href: "/platform-admin/logs", icon: "logs" },
  { labelKey: "admin.sidebar.navAnnouncements", href: "/platform-admin/announcements", icon: "announcements" },
  { labelKey: "admin.sidebar.navNotifications", href: "/platform-admin/notifications", icon: "notifications" },
  { labelKey: "admin.sidebar.navSettings", href: "/platform-admin/settings", icon: "settings" },
  { labelKey: "admin.sidebar.navUsers", href: "/platform-admin/users", icon: "users" },
] as const;

export function isAdminDashboardNavActive(href: string, pathname: string): boolean {
  if (href === PLATFORM_ADMIN_DASHBOARD_HREF) {
    return pathname === PLATFORM_ADMIN_DASHBOARD_HREF;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
