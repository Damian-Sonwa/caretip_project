/**
 * Business dashboard presentation tokens — aligned with the employee shell.
 * Presentation only — no logic.
 */

import { dashboardSharedUi } from "../dashboard/dashboardSharedUi";
import { employeeUi } from "../employee/employeeDashboardUi";
import { caretipType } from "@/lib/typography/caretipType";

/** Root wrapper class on `.caretip-dashboard-shell` (see BusinessLayout). */
export const BUSINESS_DASHBOARD_ROOT = "business-dashboard";

/** Shared rhythm with employee dashboard; class names scoped via shell root. */
export const businessUi = {
  ...employeeUi,
  page: "business-page min-h-0 pb-16 sm:pb-20",
  pageInner: "caretip-container business-page__inner pt-4 max-lg:pt-3.5 sm:pt-7",
  /** Overview analytics stack — consistent vertical rhythm below hero. */
  section: "employee-section business-dashboard-section space-y-5 sm:space-y-6 lg:space-y-7",
  statsGrid:
    "business-dashboard-stats-grid grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5",
  analyticsChartsGrid:
    "business-dashboard-analytics-grid grid items-stretch gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-6",
  bottomGrid:
    "business-dashboard-bottom-grid grid items-stretch gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-6",
  card: "business-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] transition-shadow hover:shadow-[0_14px_40px_-16px_rgba(15,23,42,0.14)]",
  cardStatic:
    "business-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",
  statCard:
    "business-stat-card flex min-h-[7.25rem] flex-col rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] sm:min-h-[8.5rem] sm:p-5",
  periodToggle:
    "business-period-toggle flex w-full max-w-full flex-wrap gap-1.5 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-[0_4px_18px_-8px_rgba(15,23,42,0.08)] sm:w-fit",

  /** Business sub-routes with back link + DashboardHero (QR, staff, etc.). */
  subPageTop: "dashboard-subpage-top w-full px-4 sm:px-6",
  subPageBreadcrumb: "dashboard-subpage-breadcrumb flex items-center gap-2",
  subPageHero: "mb-4 max-lg:mb-3",
  heroBadge:
    "dashboard-hero-badge--compact normal-case tracking-[0.06em] max-lg:gap-1.5 max-lg:px-2 max-lg:py-0.5 max-lg:text-[10px] sm:px-2.5 sm:py-0.5",
  heroActionBtn: "h-11 min-h-11 w-full max-w-full px-5 text-sm font-semibold sm:w-auto sm:max-w-none",
  /** Hero dashboard CTA pair — wrap long labels (e.g. Manage QR codes). */
  heroCtaLink:
    "inline-flex min-w-0 items-center justify-center gap-1.5 px-2 text-center text-xs font-semibold leading-snug [text-wrap:balance] sm:gap-2 sm:px-3 sm:text-sm",
  atAGlanceCard:
    "business-card dashboard-at-a-glance mt-3 w-full rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] max-lg:mt-2.5",
  atAGlanceContent: "dashboard-at-a-glance__content p-0",
  atAGlanceLabel: "dashboard-at-a-glance__label mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  atAGlanceStatLabel: caretipType.kpiLabel,
  atAGlanceStatValue: "dashboard-at-a-glance__stat-value font-bold tabular-nums text-foreground",
  subPageMain: "dashboard-subpage-after-metrics w-full px-4 sm:px-6",

  ...dashboardSharedUi,
} as const;
