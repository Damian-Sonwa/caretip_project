/** Root class on `.caretip-dashboard-shell` — platform admin shell (see SuperAdminLayout). */
export const PLATFORM_DASHBOARD_ROOT = "platform-dashboard";

import { caretipBtnPrimary } from "@/lib/caretipButtonSystem";

/**
 * Shared rhythm for platform admin pages (presentation only).
 */
export const platformUi = {
  btnPrimary: caretipBtnPrimary,
  pageMain: "bg-background",
  page: "caretip-container max-w-[min(100%,96rem)] pb-16 pt-5 sm:pb-20 sm:pt-7",

  pageHeader: "mb-8 max-lg:mb-10",
  pageTitleRow: "flex items-start gap-3",
  pageTitleIcon: "mt-0.5 h-7 w-7 shrink-0 text-accent sm:h-8 sm:w-8",
  pageTitle: "text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-[1.75rem]",
  pageSubtitle: "mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base",

  searchSection: "mb-6 max-lg:mb-8",
  searchWrap: "relative w-full max-w-xl",
  searchIcon: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
  searchInput:
    "w-full min-h-[44px] rounded-xl border-2 border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm transition-[box-shadow,border-color] focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/25",
  searchHint: "mt-2 text-xs leading-relaxed text-muted-foreground",

  backLink:
    "mb-6 inline-flex min-h-[44px] touch-manipulation items-center gap-2 text-sm font-medium text-accent transition-colors hover:underline",

  contentCard: "rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6",

  dataPanel: "overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm",
  mobileList: "space-y-3 p-4 max-lg:p-4 lg:hidden",
  tableWrap: "hidden overflow-x-auto lg:block",
  table: "w-full text-sm",
  tableHeadRow: "border-b border-border bg-muted/40 text-left",
  tableTh:
    "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:normal-case lg:tracking-normal",
  tableRow: "border-b border-border/60 transition-colors hover:bg-muted/30",
  tableTd: "px-4 py-3",
  panelFooter: "border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground",
  emptyState: "px-4 py-12 text-center text-sm text-muted-foreground",

  mobileCard:
    "block rounded-2xl border-2 border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/25 active:bg-muted/40",

  /** Single column on phone; 2-up from sm; 3-up from lg; 5-up only on very wide viewports. */
  statGrid:
    "platform-admin-stat-grid relative mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:mb-12 lg:grid-cols-3 lg:gap-5 xl:grid-cols-3 xl:gap-6 min-[1536px]:grid-cols-5 min-[1536px]:gap-5",

  statCard:
    "platform-admin-stat-card @container/stat relative h-full min-h-[8.25rem] min-w-0 overflow-hidden border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md sm:min-h-[8.75rem]",
  statCardHeader: "min-w-0 space-y-0 px-4 pb-4 pt-4 sm:px-5 sm:pt-5",
  statCardLabel:
    "text-[11px] font-medium uppercase leading-snug tracking-wide text-muted-foreground sm:text-xs",
  statCardValue:
    "platform-admin-stat-value mt-2 min-w-0 max-w-full text-balance text-xl font-bold tabular-nums leading-[1.1] tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-2xl",
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
