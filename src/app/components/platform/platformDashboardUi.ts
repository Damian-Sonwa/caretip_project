/** Root class on `.caretip-dashboard-shell` — platform admin shell (see SuperAdminLayout). */
export const PLATFORM_DASHBOARD_ROOT = "platform-dashboard";

/**
 * Shared rhythm for platform admin pages (presentation only).
 */
export const platformUi = {
  page: "caretip-container max-w-[min(100%,96rem)] pb-16 pt-5 sm:pb-20 sm:pt-7",

  /** Single column on phone; 2-up from sm; full grid from lg. */
  statGrid:
    "platform-admin-stat-grid relative mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:mb-12 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5 xl:gap-6",

  statCard:
    "platform-admin-stat-card relative h-full min-h-[8.25rem] overflow-visible border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md sm:min-h-[8.75rem]",
  statCardHeader: "space-y-0 px-4 pb-4 pt-4 sm:px-5 sm:pt-5",
  statCardLabel:
    "text-[11px] font-medium uppercase leading-snug tracking-wide text-muted-foreground sm:text-xs",
  statCardValue:
    "platform-admin-stat-value mt-2 whitespace-nowrap text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl lg:text-3xl",
  statCardChange: "mt-2 line-clamp-2 text-xs leading-snug text-muted-foreground sm:text-sm",

  analyticsSection: "platform-admin-analytics-section mb-12 max-lg:mb-14",
  analyticsHeader: "mb-6 flex flex-col gap-4 max-lg:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-5",
  analyticsHeaderCopy: "min-w-0 space-y-2",
  analyticsControls: "flex w-full flex-col gap-3 max-lg:gap-4 sm:w-auto sm:max-w-[min(100%,16rem)] sm:items-end",
  analyticsChartsGrid: "platform-admin-charts-grid grid grid-cols-1 gap-5 max-lg:gap-6 lg:grid-cols-2 lg:gap-6",

  analyticsCard: "overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm",
  analyticsCardHeader: "space-y-2 border-b border-border bg-muted/40 px-4 pb-4 pt-5 sm:px-5",
  analyticsCardTitle: "text-base font-semibold text-foreground",
  analyticsCardDesc: "text-pretty text-sm leading-relaxed text-muted-foreground max-lg:line-clamp-3 lg:line-clamp-none",
  analyticsCardBody: "p-4 pt-6 max-lg:pt-7 sm:p-5 sm:pt-8",
  analyticsChartWrap: "h-[220px] w-full min-w-0 sm:h-[260px]",

  businessesPanel: "overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm",
  businessesPanelHeader:
    "flex items-center justify-between gap-3 border-b border-border bg-muted px-4 py-4 max-lg:px-4 max-lg:py-4",
  businessesSearchWrap: "border-b border-border px-4 py-3.5 max-lg:py-4",
  businessesMobileList: "space-y-3 p-4 max-lg:p-4 lg:hidden",
  businessesTableWrap: "hidden overflow-x-auto lg:block",
} as const;
