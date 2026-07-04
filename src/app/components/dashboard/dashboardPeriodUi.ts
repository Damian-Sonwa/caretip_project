/**
 * Shared period segmented-control tokens (business + employee analytics).
 */
export const dashboardPeriodUi = {
  periodToggle:
    "dashboard-period-toggle flex w-full min-w-0 max-w-full flex-nowrap gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-sm sm:gap-1.5 sm:p-1 sm:w-fit",
  periodBtn:
    "dashboard-period-toggle__btn relative flex min-h-9 min-w-0 flex-1 basis-0 items-center justify-center rounded-[0.4375rem] px-1 py-1.5 text-[0.6875rem] font-semibold leading-tight transition-colors sm:min-h-10 sm:min-w-[5.75rem] sm:flex-initial sm:basis-auto sm:px-4 sm:py-2 sm:text-sm",
  periodBtnActive: "bg-primary text-primary-foreground shadow-sm",
  periodBtnIdle: "text-muted-foreground hover:bg-muted",
  periodBtnLabel:
    "min-w-0 px-0.5 text-center leading-tight [text-wrap:balance] sm:px-0",
  periodBtnLoadingDot:
    "ml-0.5 inline-flex w-2 shrink-0 items-center justify-center",
} as const;
