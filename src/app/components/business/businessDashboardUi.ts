/**
 * Business dashboard presentation tokens — aligned with the employee shell.
 * Presentation only — no logic.
 */

import { employeeUi } from "../employee/employeeDashboardUi";

/** Root wrapper class on `.caretip-dashboard-shell` (see BusinessLayout). */
export const BUSINESS_DASHBOARD_ROOT = "business-dashboard";

/** Shared rhythm with employee dashboard; class names scoped via shell root. */
export const businessUi = {
  ...employeeUi,
  page: "business-page min-h-0 pb-16 sm:pb-20",
  pageInner: "caretip-container business-page__inner pt-5 sm:pt-7",
  card: "business-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] transition-shadow hover:shadow-[0_14px_40px_-16px_rgba(15,23,42,0.14)]",
  cardStatic:
    "business-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",
  statCard:
    "business-stat-card flex min-h-[7.25rem] flex-col rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] sm:min-h-[8.5rem] sm:p-5",
  periodToggle:
    "business-period-toggle flex w-full max-w-full flex-wrap gap-1.5 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-[0_4px_18px_-8px_rgba(15,23,42,0.08)] sm:w-fit",
} as const;
