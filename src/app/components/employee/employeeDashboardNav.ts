import type { CareIconName } from "@/components/icons";
import {
  hasSubscriptionCapability,
  type BusinessSubscriptionTier,
  type SubscriptionCapability,
} from "../../lib/subscriptionCapabilities";

export type EmployeeDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: CareIconName;
};

export const employeeDashboardNavItems: readonly EmployeeDashboardNavItem[] = [
  { labelKey: "dashboardNav.employee.overview", href: "/employee/dashboard", icon: "overview" },
  { labelKey: "dashboardNav.employee.inbox", href: "/employee/inbox", icon: "inbox" },
  { labelKey: "dashboardNav.employee.tipHistory", href: "/employee/tip-history", icon: "transactions" },
  { labelKey: "dashboardNav.employee.tipGoals", href: "/employee/tip-goals", icon: "tipGoals" },
  { labelKey: "dashboardNav.employee.settings", href: "/employee/settings", icon: "settings" },
] as const;

const EMPLOYEE_NAV_CAPABILITY_BY_HREF: Partial<Record<string, SubscriptionCapability>> = {
  "/employee/tip-goals": "employeeGoals",
};

export function filterEmployeeDashboardNavItems(
  items: readonly EmployeeDashboardNavItem[],
  tier: BusinessSubscriptionTier | undefined | null,
): EmployeeDashboardNavItem[] {
  return items.filter((item) => {
    const cap = EMPLOYEE_NAV_CAPABILITY_BY_HREF[item.href];
    if (!cap) return true;
    return hasSubscriptionCapability(tier, cap);
  });
}

export function isEmployeeDashboardNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
