/**
 * Cross-shell dashboard presentation hooks (business + employee).
 * Scoped via `.caretip-dashboard-shell` in dashboard-ecosystem-polish.css.
 */
export const dashboardSharedUi = {
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
