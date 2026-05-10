import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  UserCircle,
  HelpCircle,
  Wallet,
  Building2,
} from "lucide-react";

export type DashboardShellNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardShellNavItems: readonly DashboardShellNavItem[] = [
  { labelKey: "shell.nav.overview", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "shell.nav.businessProfile", href: "/dashboard/profile", icon: Building2 },
  { labelKey: "shell.nav.tipsActivity", href: "/dashboard/transactions", icon: Wallet },
  { labelKey: "shell.nav.notifications", href: "/dashboard/notifications", icon: Bell },
  { labelKey: "shell.nav.support", href: "/dashboard/support", icon: HelpCircle },
  { labelKey: "shell.nav.profileSettings", href: "/dashboard/profile-settings", icon: UserCircle },
] as const;
