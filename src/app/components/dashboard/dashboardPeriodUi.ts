/**
 * Shared period segmented-control tokens (business + employee analytics).
 */
export const dashboardPeriodUi = {
  periodToggle:
    "dashboard-period-toggle flex w-full max-w-full flex-nowrap gap-1.5 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-[0_4px_18px_-8px_rgba(15,23,42,0.08)] sm:w-fit",
  periodBtn:
    "dashboard-period-toggle__btn min-h-10 flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:min-w-[5.75rem] sm:flex-initial sm:px-4 sm:text-sm",
  periodBtnActive: "bg-primary text-primary-foreground shadow-sm",
  periodBtnIdle: "text-muted-foreground hover:bg-stone-50",
  /** Reserved slot so loading dots never shift adjacent tabs. */
  periodBtnLoadingSlot: "inline-flex w-3.5 shrink-0 items-center justify-center",
} as const;
