import type { LucideIcon } from "lucide-react";
import { Settings } from "lucide-react";

export type EmployeeDashboardNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const employeeDashboardNavItems: readonly EmployeeDashboardNavItem[] = [
  { name: "Settings", href: "/employee/settings", icon: Settings },
] as const;

export function isEmployeeDashboardNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

