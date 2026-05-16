/**
 * Mobile-first landing rhythm — aligned with the cinematic hero (FeatureShowcase).
 * Presentation tokens only.
 */
export const landingUi = {
  section:
    "scroll-mt-[80px] w-full min-w-0 px-4 py-10 max-lg:py-10 sm:px-6 sm:py-16 lg:py-20",
  sectionMuted: "bg-gray-50 dark:bg-neutral-900",
  sectionWhite: "bg-white dark:bg-neutral-950",

  /** Split layout: copy + visual */
  splitGrid:
    "mx-auto grid max-w-7xl grid-cols-1 items-start gap-5 max-lg:gap-5 sm:gap-8 lg:grid-cols-2 lg:items-center lg:gap-12",
  copyColumn:
    "order-1 flex w-full min-w-0 flex-col items-start text-left max-lg:space-y-4 lg:max-w-none",
  visualColumn:
    "order-2 flex w-full min-w-0 flex-col items-center justify-center max-lg:pt-0 lg:order-none",

  copyStack: "flex w-full flex-col items-start space-y-2.5 max-lg:space-y-2 sm:space-y-3",
  pill: "inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:px-3 sm:py-1 sm:text-xs",
  headline:
    "max-w-[22ch] text-balance text-[1.65rem] font-bold leading-[1.18] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100 sm:max-w-none sm:text-3xl sm:leading-[1.12] md:text-4xl lg:text-5xl",
  subtitle:
    "max-w-[36ch] text-pretty text-[15px] font-normal leading-[1.68] tracking-[-0.01em] text-neutral-600 dark:text-neutral-400 sm:max-w-xl sm:text-base sm:leading-relaxed md:text-lg",

  benefitList: "w-full space-y-3 max-lg:space-y-2.5 sm:space-y-3.5",
  cta: "inline-flex w-full max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90 max-lg:h-11 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4",

  visualFrame:
    "mx-auto w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-[2rem] lg:rounded-[2.5rem]",
  visualImgContain:
    "mx-auto block h-auto max-h-[min(40vh,320px)] w-full max-w-full object-contain object-center sm:max-h-[min(48vh,420px)] lg:max-h-none",

  /** Centered section intros → left on mobile, centered from sm+ if needed */
  sectionIntro: "mb-6 w-full max-w-full space-y-2.5 text-left max-lg:mb-5 sm:mb-10 sm:space-y-3 lg:text-center",
  sectionTitle:
    "max-w-[min(100%,28ch)] text-balance text-[1.65rem] font-bold leading-[1.18] tracking-[-0.02em] text-neutral-900 max-lg:text-left sm:max-w-2xl sm:text-3xl sm:leading-[1.12] md:text-4xl lg:mx-auto lg:max-w-3xl lg:text-center lg:text-5xl dark:text-neutral-100",
  sectionSubtitle:
    "max-w-[36ch] text-pretty text-[15px] font-normal leading-[1.68] tracking-[-0.01em] text-neutral-600 max-lg:text-left sm:max-w-2xl sm:text-base sm:leading-relaxed lg:mx-auto lg:text-center dark:text-neutral-400",
} as const;
