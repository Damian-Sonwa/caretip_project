import type { LucideIcon } from "lucide-react";
import { Bell, Inbox, LayoutDashboard, Settings, Target } from "lucide-react";
import {
  hasSubscriptionCapability,
  type BusinessSubscriptionTier,
  type SubscriptionCapability,
} from "../../lib/subscriptionCapabilities";

export type EmployeeDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const employeeDashboardNavItems: readonly EmployeeDashboardNavItem[] = [
  { labelKey: "dashboardNav.employee.overview", href: "/employee/dashboard", icon: LayoutDashboard },
  { labelKey: "dashboardNav.employee.inbox", href: "/employee/inbox", icon: Inbox },
  { labelKey: "dashboardNav.employee.notifications", href: "/employee/notifications", icon: Bell },
  { labelKey: "dashboardNav.employee.tipGoals", href: "/employee/tip-goals", icon: Target },
  { labelKey: "dashboardNav.employee.settings", href: "/employee/settings", icon: Settings },
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
