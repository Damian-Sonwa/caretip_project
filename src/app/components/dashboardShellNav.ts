import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bell,
  Settings,
  HelpCircle,
  Wallet,
} from "lucide-react";

export type DashboardShellNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardShellNavItems: readonly DashboardShellNavItem[] = [
  { labelKey: "shell.nav.overview", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "shell.nav.tipsActivity", href: "/dashboard/transactions", icon: Wallet },
  { labelKey: "shell.nav.notifications", href: "/dashboard/notifications", icon: Bell },
  { labelKey: "shell.nav.support", href: "/dashboard/support", icon: HelpCircle },
  { labelKey: "shell.nav.settings", href: "/dashboard/settings", icon: Settings },
] as const;
