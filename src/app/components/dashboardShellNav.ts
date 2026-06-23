import type { CareIconName } from "@/components/icons";

export type DashboardShellNavItem = {
  labelKey: string;
  href: string;
  icon: CareIconName;
};

export const dashboardShellNavItems: readonly DashboardShellNavItem[] = [
  { labelKey: "shell.nav.overview", href: "/dashboard", icon: "overview" },
  { labelKey: "shell.nav.tipsActivity", href: "/dashboard/tips/transactions", icon: "tipsActivity" },
  { labelKey: "shell.nav.notifications", href: "/dashboard/notifications", icon: "notifications" },
  { labelKey: "shell.nav.support", href: "/dashboard/support", icon: "support" },
  { labelKey: "shell.nav.settings", href: "/dashboard/settings", icon: "settings" },
] as const;
