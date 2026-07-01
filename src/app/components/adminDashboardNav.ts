/**
 * @deprecated Platform admin navigation uses `platformAdminNav.ts` and `PlatformSidebarNavShell`.
 * Legacy hrefs are kept for redirects and deep links.
 */
import {
  PLATFORM_ADMIN_OVERVIEW_HREF,
  PLATFORM_BUSINESS_BASE,
  PLATFORM_COMMUNICATION_BASE,
  PLATFORM_REPORTS_BASE,
  PLATFORM_REVENUE_BASE,
  PLATFORM_SYSTEM_BASE,
  PLATFORM_USERS_BASE,
} from "./platform/platformAdminNav";

export const PLATFORM_ADMIN_DASHBOARD_HREF = PLATFORM_ADMIN_OVERVIEW_HREF;

export function isAdminDashboardNavActive(href: string, pathname: string): boolean {
  if (href === PLATFORM_ADMIN_DASHBOARD_HREF) {
    return pathname === PLATFORM_ADMIN_DASHBOARD_HREF;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** @deprecated Use platformAdminNavEntries — flat list for legacy consumers only. */
export const adminDashboardNavItems = [
  { labelKey: "admin.sidebar.navOverview", href: PLATFORM_ADMIN_DASHBOARD_HREF, icon: "overview" as const },
  { labelKey: "admin.sidebar.navBusinesses", href: `${PLATFORM_BUSINESS_BASE}/verification`, icon: "businesses" as const },
  { labelKey: "admin.sidebar.navTransactions", href: `${PLATFORM_REVENUE_BASE}/transactions`, icon: "transactions" as const },
  { labelKey: "admin.sidebar.navLogs", href: `${PLATFORM_REPORTS_BASE}/audit-logs`, icon: "logs" as const },
  { labelKey: "admin.sidebar.navAnnouncements", href: `${PLATFORM_COMMUNICATION_BASE}/broadcasts`, icon: "announcements" as const },
  { labelKey: "admin.sidebar.navNotifications", href: `${PLATFORM_COMMUNICATION_BASE}/inbox`, icon: "notifications" as const },
  { labelKey: "admin.sidebar.navSettings", href: `${PLATFORM_SYSTEM_BASE}/settings`, icon: "settings" as const },
  { labelKey: "admin.sidebar.navUsers", href: `${PLATFORM_USERS_BASE}/management`, icon: "users" as const },
] as const;
