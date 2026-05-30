import type { CareIconName } from "@/components/icons";
import {
  hasSubscriptionCapability,
  type BusinessSubscriptionTier,
  type SubscriptionCapability,
} from "../../lib/subscriptionCapabilities";

export const BUSINESS_DASHBOARD_HOME_HREF = "/dashboard" as const;

export type BusinessDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: CareIconName;
};

export const businessDashboardNavItems: readonly BusinessDashboardNavItem[] = [
  { labelKey: "dashboardNav.business.overview", href: "/dashboard", icon: "overview" },
  { labelKey: "dashboardNav.business.team", href: "/dashboard/staff-management", icon: "team" },
  { labelKey: "dashboardNav.business.qrCodes", href: "/dashboard/qr-code-management", icon: "tableQr" },
  { labelKey: "dashboardNav.business.locations", href: "/dashboard/locations", icon: "locations" },
  { labelKey: "dashboardNav.business.tables", href: "/dashboard/tables", icon: "tables" },
  { labelKey: "dashboardNav.business.tipsActivity", href: "/dashboard/transactions", icon: "tipsActivity" },
  { labelKey: "dashboardNav.business.notifications", href: "/dashboard/notifications", icon: "notifications" },
  { labelKey: "dashboardNav.business.support", href: "/dashboard/support", icon: "support" },
  { labelKey: "dashboardNav.business.settings", href: "/dashboard/settings", icon: "settings" },
] as const;

/** Premium-only nav targets (Basic keeps locations for single-site management). */
const BUSINESS_NAV_CAPABILITY_BY_HREF: Partial<Record<string, SubscriptionCapability>> = {
  "/dashboard/tables": "tableQr",
};

export function filterBusinessDashboardNavItems(
  items: readonly BusinessDashboardNavItem[],
  tier: BusinessSubscriptionTier | undefined | null,
): BusinessDashboardNavItem[] {
  return items.filter((item) => {
    const cap = BUSINESS_NAV_CAPABILITY_BY_HREF[item.href];
    if (!cap) return true;
    return hasSubscriptionCapability(tier, cap);
  });
}

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
