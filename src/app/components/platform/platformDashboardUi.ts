/** Root class on `.caretip-dashboard-shell` — platform admin shell (see SuperAdminLayout). */
export const PLATFORM_DASHBOARD_ROOT = "platform-dashboard";

/**
 * Shared rhythm with employee/business dashboards (presentation only).
 * Admin pages use `.caretip-dashboard-shell.platform-dashboard` context.
 */
export const platformUi = {
  /** Primary content wrapper inside SuperAdminLayout `<Outlet />` routes. */
  page: "caretip-container max-w-[min(100%,96rem)] pb-16 sm:pb-20 pt-5 sm:pt-7",
  /** Top stats row — 2-up on phone, matches business/employee density. */
  statGrid:
    "relative mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:grid-cols-3 xl:grid-cols-5 xl:gap-6",
  analyticsChartsGrid: "grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2",
} as const;
