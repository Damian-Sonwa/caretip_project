/**
 * Shared presentation tokens for the employee dashboard shell.
 * Presentation only — no logic.
 */

import { dashboardSharedUi } from "../dashboard/dashboardSharedUi";
import { caretipBtnGhost, caretipBtnPrimary, caretipBtnSecondary } from "@/lib/caretipButtonSystem";
import { caretipType } from "@/lib/typography/caretipType";

/** Root wrapper class on `.caretip-dashboard-shell` (see EmployeeLayout). */
export const EMPLOYEE_DASHBOARD_ROOT = "employee-dashboard";

export const employeeUi = {
  page: "employee-page min-h-0 pb-16 sm:pb-20",
  pageInner: "caretip-container employee-page__inner pt-5 sm:pt-7",
  section: "employee-section employee-dashboard-section space-y-5 sm:space-y-6 lg:space-y-7",
  sectionTight: "employee-section space-y-3 sm:space-y-4",
  statsGrid:
    "employee-dashboard-stats-grid grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5",

  card:
    "employee-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] transition-shadow hover:shadow-[0_14px_40px_-16px_rgba(15,23,42,0.14)]",
  cardStatic:
    "employee-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",
  cardPad: "p-4 sm:p-5 md:p-6",
  cardHeader: "border-b border-neutral-100/90 px-4 py-3.5 sm:px-6 sm:py-4",
  cardTitle: "text-base font-semibold tracking-tight text-foreground",

  pageHeader:
    "employee-page-header mb-6 overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white via-white to-stone-50/95 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",
  pageHeaderInner: "flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-6 sm:py-6",
  pageTitle: "text-xl font-bold tracking-tight text-foreground sm:text-2xl",
  pageDesc: "mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground",

  btnPrimary: caretipBtnPrimary,
  btnSecondary: caretipBtnSecondary,
  btnGhost: caretipBtnGhost,

  iconTile: "inline-flex rounded-xl bg-primary/10 p-2.5",
  iconTileMuted: "inline-flex rounded-xl bg-stone-100 p-2.5 text-stone-600",

  periodToggle:
    "employee-period-toggle flex w-full max-w-full flex-wrap gap-1.5 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-[0_4px_18px_-8px_rgba(15,23,42,0.08)] sm:w-fit",
  periodBtn:
    "min-h-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:flex-initial sm:px-4 sm:text-sm",
  periodBtnActive: "bg-primary text-primary-foreground shadow-sm",
  periodBtnIdle: "text-muted-foreground hover:bg-stone-50",

  /** Hero CTA pair — allow long labels (e.g. DE “Trinkgeldziel setzen”) to wrap */
  heroCtaBtn:
    "min-w-0 flex-1 basis-0 !h-auto min-h-11 py-2 !whitespace-normal text-center !leading-snug [text-wrap:balance]",
  heroCtaLink:
    "inline-flex min-w-0 w-full items-center justify-center gap-1.5 text-center leading-snug [text-wrap:balance] sm:gap-2",

  listItem:
    "employee-list-item rounded-2xl border border-neutral-200/70 bg-white shadow-[0_6px_24px_-12px_rgba(15,23,42,0.08)] transition-colors",
  listItemSelected: "bg-primary/[0.04] ring-1 ring-primary/20",

  statCard:
    "employee-stat-card flex min-h-[7.25rem] flex-col rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] sm:min-h-[8.5rem] sm:p-5",
  statLabel: caretipType.kpiLabel,
  statValue: caretipType.kpiValue,
  statChange: "line-clamp-2 text-xs leading-snug text-muted-foreground",

  emptyWrap: "employee-empty flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-14 md:py-16",
  emptyIcon: "flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-muted-foreground/70",
  emptyTitle: "mt-5 text-base font-semibold text-foreground",
  emptyDesc: "mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground",

  settingsSection:
    "employee-settings-section dashboard-settings-panel space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] sm:p-6",
  settingsHeading: "text-base font-semibold tracking-tight text-foreground",

  ...dashboardSharedUi,
} as const;
