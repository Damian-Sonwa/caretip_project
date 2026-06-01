/**
 * Cross-shell dashboard presentation hooks (business + employee).
 * Scoped via `.caretip-dashboard-shell` in dashboard-ecosystem-polish.css.
 */
export const dashboardSharedUi = {
  /** Full-width dashboard page shell (uses .caretip-container + desktop layout CSS). */
  page: "dashboard-page w-full min-w-0",
  pageInner: "dashboard-page-inner caretip-container w-full min-w-0",
  /** Legacy narrow pages — constrained below xl, full width on desktop. */
  pageNarrow:
    "dashboard-page-narrow mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8",
  pageContained:
    "dashboard-page-contained mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
  inboxPage: "dashboard-inbox-page caretip-container w-full min-w-0 max-w-2xl px-4 py-6 sm:px-6 sm:py-8 xl:max-w-none",
  inboxMasterDetail:
    "dashboard-inbox-master-detail flex min-h-0 flex-col xl:grid xl:min-h-[calc(100dvh-11rem)] xl:grid-cols-[minmax(280px,24rem)_minmax(0,1fr)] xl:overflow-hidden xl:rounded-2xl xl:border xl:border-border xl:bg-card xl:shadow-sm",
  inboxListPane:
    "dashboard-inbox-list flex min-h-0 flex-col xl:w-[min(100%,24rem)] xl:shrink-0 xl:border-r xl:border-border",
  inboxDetailPane:
    "dashboard-inbox-detail hidden min-h-0 min-w-0 flex-1 flex-col xl:flex",
  cardDesc: "dashboard-card-desc",
  chartCard: "dashboard-chart-card",
  chartFrame: "dashboard-chart-frame",
  chartEmpty: "dashboard-chart-empty",
  chartInsight: "dashboard-chart-insight",
  listRow: "dashboard-list-row",
  surfacePanel: "dashboard-surface-panel",
  settingsPanel: "dashboard-settings-panel",
  pageShell: "dashboard-page-shell",
  filterPanel:
    "dashboard-filter-panel rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",
  tablePanel:
    "dashboard-table-panel max-w-full overflow-x-auto overflow-y-visible rounded-2xl border border-neutral-200/80 bg-white pb-1 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",
  notificationCard:
    "dashboard-notification-card rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.08)] sm:p-5",
  notificationCardUnread:
    "dashboard-notification-card rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.08)] sm:p-5",
} as const;
