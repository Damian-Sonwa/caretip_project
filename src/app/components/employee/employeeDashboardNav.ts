import type { LucideIcon } from "lucide-react";
import { Bell, Inbox, LayoutDashboard, Settings, Target } from "lucide-react";

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

export function isEmployeeDashboardNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
