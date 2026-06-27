/**
 * Business dashboard presentation tokens — aligned with the employee shell.
 * Presentation only — no logic.
 */

import { dashboardSharedUi } from "../dashboard/dashboardSharedUi";
import { DASHBOARD_METRIC_STAT_CARD_SHELL } from "../dashboard/dashboardMetricTokens";
import { employeeUi } from "../employee/employeeDashboardUi";
import { caretipType } from "@/lib/typography/caretipType";

/** Root wrapper class on `.caretip-dashboard-shell` (see BusinessLayout). */
export const BUSINESS_DASHBOARD_ROOT = "business-dashboard";

/** Shared rhythm with employee dashboard; class names scoped via shell root. */
const { page: _employeePage, pageInner: _employeePageInner, ...employeeUiRest } = employeeUi;
const { page: _sharedPage, pageInner: _sharedPageInner, ...dashboardSharedRest } = dashboardSharedUi;

export const businessUi = {
  ...employeeUiRest,
  iconTileMuted: "business-dash-icon-tile shrink-0",
  page: "business-page min-h-0 pb-16 sm:pb-20",
  pageInner: "caretip-container business-page__inner px-4 pt-3 max-lg:pt-3 sm:px-6 sm:pt-4",
  /** Shared shell for module routes (Billing, Team, QR Studio, etc.). */
  modulePageShell: "business-module-page bg-background px-4 pb-20 sm:px-6 lg:px-8",
  modulePageContained: "dashboard-page-contained mx-auto w-full max-w-6xl",
  /** Overview analytics stack — consistent vertical rhythm below hero. */
  section: "employee-section business-dashboard-section space-y-6 sm:space-y-7 lg:space-y-8",
  statsGrid:
    "business-dashboard-stats-grid grid grid-cols-2 items-stretch gap-3 gap-y-3 sm:gap-3.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5",
  /** At-a-glance mini-stats — 2-up on phones, 3-up from tablet. */
  atAGlanceGrid:
    "dashboard-at-a-glance__grid grid grid-cols-2 gap-2 text-center min-[375px]:gap-2.5 sm:grid-cols-3 sm:gap-3",
  /** Mobile list/card pattern (mirrors platform admin responsive data). */
  mobileList: "business-mobile-list space-y-3 p-4 max-lg:p-4 lg:hidden",
  mobileCard:
    "business-mobile-card block rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.08)] transition-colors active:bg-muted/30",
  tableWrap: "hidden overflow-x-auto lg:block",
  analyticsChartsGrid:
    "business-dashboard-analytics-grid grid items-stretch gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-6",
  bottomGrid:
    "business-dashboard-bottom-grid grid items-stretch gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-6",
  card: "business-card overflow-hidden rounded-[1.125rem] border border-neutral-200/70 bg-white/95 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] backdrop-blur-[2px] transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-18px_rgba(15,23,42,0.16)]",
  cardStatic:
    "business-card overflow-hidden rounded-[1.125rem] border border-neutral-200/70 bg-white/95 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] backdrop-blur-[2px]",
  statCard: `business-stat-card ${DASHBOARD_METRIC_STAT_CARD_SHELL}`,
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
    "business-card dashboard-at-a-glance mt-3 w-full rounded-[1.125rem] border border-neutral-200/70 bg-white/95 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] max-lg:mt-2.5",
  atAGlanceContent: "dashboard-at-a-glance__content p-0",
  atAGlanceLabel: "dashboard-at-a-glance__label mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  atAGlanceStatLabel: caretipType.kpiLabel,
  atAGlanceStatValue: "dashboard-at-a-glance__stat-value font-bold tabular-nums text-foreground",
  subPageMain: "dashboard-subpage-after-metrics w-full px-4 sm:px-6",

  ...dashboardSharedRest,
} as const;
