/**
 * Mobile-first landing rhythm — section headers centered on mobile (TipJAR-style),
 * body content (cards, lists, CTAs) stays left-aligned for scanability.
 * Presentation tokens only.
 */
export const landingUi = {
  section:
    "scroll-mt-[80px] w-full min-w-0 px-4 py-11 max-lg:pt-12 max-lg:pb-10 sm:px-6 sm:py-16 lg:py-20",
  sectionMuted: "bg-gray-50 dark:bg-neutral-900",
  sectionWhite: "bg-white dark:bg-neutral-950",

  /** Split layout: copy + visual */
  splitGrid:
    "mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 max-lg:gap-6 sm:gap-8 lg:grid-cols-2 lg:items-center lg:gap-12",
  copyColumn:
    "order-1 flex w-full min-w-0 flex-col items-start text-left max-lg:space-y-4 lg:max-w-none",
  visualColumn:
    "order-2 flex w-full min-w-0 flex-col items-center justify-center max-lg:pt-1 lg:order-none",

  /** Pill + title + subtitle — centered on mobile, left from lg in split sections */
  copyStack:
    "flex w-full flex-col items-start space-y-3 max-lg:items-center max-lg:text-center max-lg:space-y-3.5 lg:items-start lg:text-left sm:space-y-3",
  pillRow: "flex w-full flex-wrap items-center gap-2 max-lg:justify-center lg:justify-start",
  pill: "inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary max-lg:mx-auto lg:mx-0 sm:px-3 sm:py-1 sm:text-xs",
  headline:
    "mx-auto max-w-[min(100%,24ch)] text-balance text-center text-[1.65rem] font-bold leading-[1.18] tracking-[-0.02em] text-neutral-900 max-lg:px-0.5 dark:text-neutral-100 sm:text-3xl sm:leading-[1.12] md:text-4xl lg:mx-0 lg:max-w-[22ch] lg:text-left lg:text-5xl",
  subtitle:
    "mx-auto max-w-[min(100%,34ch)] text-pretty text-center text-[15px] font-normal leading-[1.68] tracking-[-0.01em] text-neutral-600 max-lg:px-0.5 dark:text-neutral-400 sm:max-w-xl sm:text-base sm:leading-relaxed md:text-lg lg:mx-0 lg:max-w-[36ch] lg:text-left",

  benefitList: "w-full space-y-3 max-lg:mt-1 max-lg:space-y-2.5 sm:space-y-3.5",
  cta: "inline-flex w-full max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90 max-lg:h-11 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4",

  visualFrame:
    "mx-auto w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-[2rem] lg:rounded-[2.5rem]",
  visualImgContain:
    "mx-auto block h-auto max-h-[min(40vh,320px)] w-full max-w-full object-contain object-center sm:max-h-[min(48vh,420px)] lg:max-h-none",

  /** Full-width section intros (features, real life, hospitality) */
  sectionIntro:
    "mb-7 flex w-full max-w-full flex-col items-center space-y-3.5 text-center max-lg:mb-8 max-lg:space-y-4 sm:mb-10 sm:space-y-4 lg:mb-12",
  sectionTitle:
    "mx-auto max-w-[min(100%,26ch)] text-balance text-center text-[1.65rem] font-bold leading-[1.18] tracking-[-0.02em] text-neutral-900 max-lg:px-1 dark:text-neutral-100 sm:max-w-2xl sm:text-3xl sm:leading-[1.12] md:text-4xl lg:max-w-3xl lg:text-5xl",
  sectionSubtitle:
    "mx-auto max-w-[min(100%,34ch)] text-pretty text-center text-[15px] font-normal leading-[1.68] tracking-[-0.01em] text-neutral-600 max-lg:px-1 dark:text-neutral-400 sm:max-w-2xl sm:text-base sm:leading-relaxed lg:max-w-2xl",
} as const;
