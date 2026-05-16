/**
 * Landing page design system — typography scale, spacing rhythm, layout proportions.
 *
 * Responsive rules:
 * - Phone (<md): compact type (+1 step readability pass), spacing, CTAs; centered section intros
 * - Tablet/desktop split columns (md+ / lg+): copy left-aligned, visuals balanced
 * - Hero: left-aligned on all breakpoints
 * - All sections: min-w-0 + overflow-x containment to prevent horizontal scroll
 */
export const landingUi = {
  section:
    "scroll-mt-[80px] w-full min-w-0 overflow-x-hidden px-4 py-11 max-lg:pt-12 max-lg:pb-10 sm:px-6 sm:py-16 lg:py-20",
  sectionMuted: "bg-gray-50 dark:bg-neutral-900",
  sectionWhite: "bg-white dark:bg-neutral-950",

  /** Centered section header block (features, payments, social proof, hospitality intro, final CTA) */
  sectionIntro:
    "mb-8 flex w-full max-w-full flex-col items-center space-y-4 px-0.5 text-center max-lg:mb-9 sm:mb-9 sm:space-y-4 lg:mb-10",

  /** Split layout: copy + visual */
  splitGrid:
    "mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-start gap-7 overflow-x-hidden max-lg:gap-7 sm:gap-9 lg:grid-cols-2 lg:items-center lg:gap-12",
  copyColumn:
    "order-1 flex w-full min-w-0 flex-col items-start text-left max-lg:items-center max-lg:text-center max-lg:space-y-4 lg:max-w-none",
  visualColumn:
    "order-2 flex w-full min-w-0 max-w-full flex-col items-center justify-center max-lg:pt-1 lg:order-none",

  pillRow:
    "flex w-full flex-wrap items-center justify-center gap-2 max-lg:justify-center lg:justify-start",
  pill: "inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-primary max-lg:mx-auto lg:mx-0 sm:px-3 sm:py-1 sm:text-xs",

  /** Tier 2 — split / setup sections */
  copyStack:
    "flex w-full flex-col items-start space-y-3.5 max-lg:items-center max-lg:text-center max-lg:space-y-4 lg:items-start lg:text-left sm:space-y-4",
  headline:
    "mx-auto max-w-[min(100%,20ch)] text-balance text-center text-[1.4375rem] font-bold leading-[1.14] tracking-[-0.02em] text-neutral-900 max-lg:px-0.5 dark:text-neutral-100 max-md:max-w-[min(100%,20ch)] sm:text-[1.625rem] md:text-4xl md:leading-[1.1] lg:mx-0 lg:max-w-[24ch] lg:text-left lg:text-5xl lg:leading-[1.08]",
  subtitle:
    "mx-auto max-w-[min(100%,32ch)] text-pretty text-center text-[14px] font-normal leading-[1.52] tracking-[-0.01em] text-neutral-600 max-lg:px-0.5 dark:text-neutral-400 sm:text-[15px] sm:leading-[1.55] md:text-lg md:leading-relaxed lg:mx-0 lg:max-w-[38ch] lg:text-left",

  benefitList: "w-full space-y-3 max-lg:mt-1 max-lg:space-y-2.5 sm:space-y-3.5",
  cta:
    "inline-flex w-full max-w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(235,153,44,0.26)] transition-colors hover:bg-primary/90 max-md:h-9 max-md:min-h-9 max-md:rounded-lg max-md:px-4 max-md:py-2 max-md:text-[14px] sm:h-11 sm:min-h-11 sm:w-auto sm:min-w-[12rem] sm:rounded-2xl sm:px-8 sm:py-3.5 sm:text-[15px] md:h-12 md:py-4 md:text-base lg:h-auto",

  /** Tier 2 — full-width section titles */
  sectionTitle:
    "mx-auto max-w-[min(100%,20ch)] text-balance text-center text-[1.4375rem] font-bold leading-[1.14] tracking-[-0.02em] text-neutral-900 max-lg:px-1 dark:text-neutral-100 max-md:max-w-[min(100%,22ch)] sm:max-w-2xl sm:text-[1.625rem] md:text-3xl md:leading-[1.1] lg:max-w-3xl lg:text-5xl lg:leading-[1.08]",
  sectionSubtitle:
    "mx-auto max-w-[min(100%,32ch)] text-pretty text-center text-[14px] font-normal leading-[1.52] tracking-[-0.01em] text-neutral-600 max-lg:px-1 dark:text-neutral-400 sm:max-w-2xl sm:text-[15px] sm:leading-[1.55] md:text-lg md:leading-relaxed lg:max-w-2xl",

  /** Tier 3 — alternating image + copy showcases (employee, business) */
  showcaseSection:
    "scroll-mt-[80px] relative w-full min-w-0 overflow-x-hidden border-y border-neutral-200/60 px-4 py-11 max-lg:pt-12 max-lg:pb-10 sm:px-6 sm:py-16 lg:py-20 dark:border-neutral-800/80",
  showcaseSectionToneWarm:
    "bg-[linear-gradient(180deg,#faf9f7_0%,#f3f1ed_48%,#faf9f7_100%)] dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#121110_50%,#0a0a0a_100%)]",
  showcaseSectionToneMuted:
    "bg-[linear-gradient(180deg,#f4f4f5_0%,#eceae6_42%,#f4f4f5_100%)] dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#141414_48%,#0a0a0a_100%)]",
  showcaseGrid:
    "relative mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-start gap-8 overflow-x-hidden sm:gap-10 lg:grid-cols-2 lg:gap-12",
  showcaseCopy:
    "flex w-full min-w-0 max-w-xl flex-col items-start max-lg:mx-auto lg:max-w-2xl lg:items-start lg:text-left lg:self-start",
  showcaseIntro:
    "flex w-full flex-col items-start space-y-3 max-lg:items-center max-lg:text-center max-lg:space-y-3.5 lg:space-y-4 lg:items-start lg:text-left",
  showcaseHeadline:
    "mx-auto max-w-[min(100%,19ch)] text-balance text-center text-[1.4375rem] font-bold leading-[1.14] tracking-[-0.02em] text-neutral-900 max-lg:px-0.5 dark:text-neutral-100 max-md:max-w-[min(100%,20ch)] sm:text-[1.625rem] md:text-3xl md:leading-[1.1] lg:mx-0 lg:max-w-[22ch] lg:text-left lg:text-5xl lg:leading-[1.08]",
  showcaseHeadlineAccent: "mt-1 block text-primary max-md:mt-1 sm:mt-2 lg:mt-2.5",
  showcaseSubtitle:
    "mx-auto max-w-[min(100%,32ch)] text-pretty text-center text-[14px] font-normal leading-[1.52] text-neutral-700 max-lg:px-0.5 dark:text-neutral-300 sm:text-[15px] sm:leading-[1.55] md:text-lg lg:mx-0 lg:max-w-[36ch] lg:text-left",
  showcaseActionCluster:
    "mt-5 flex w-full min-w-0 flex-col gap-3 max-lg:items-start sm:mt-6 sm:gap-3.5 lg:mx-0 lg:max-w-none",
  /** Embedded feature list — light surface, no card shadow (split showcases) */
  showcaseBenefitsPanel:
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  showcaseBenefits: "mt-0 w-full max-lg:self-start",
  showcaseBenefitRow: "px-3.5 py-2 sm:px-4 sm:py-3",
  showcaseCta:
    "mt-0 w-full self-start max-md:h-9 max-md:min-h-9 max-md:py-2 max-md:px-4 max-md:text-[14px] shadow-[0_6px_18px_rgba(235,153,44,0.26)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-primary/90 hover:shadow-[0_12px_34px_rgba(235,153,44,0.38)] active:scale-[0.99] max-lg:flex max-lg:h-11 max-lg:min-h-11 max-lg:py-2.5 max-lg:px-5 max-lg:text-[14px] sm:px-7 sm:py-3.5 lg:inline-flex lg:h-auto lg:w-auto",
  showcaseVisualCol:
    "flex w-full min-w-0 max-w-full flex-col items-center justify-center max-lg:max-w-lg lg:max-w-none lg:justify-self-center",
  showcaseVisualGlow:
    "pointer-events-none absolute -inset-3 rounded-[2rem] bg-[radial-gradient(ellipse_80%_70%_at_50%_55%,rgba(235,153,44,0.12),transparent_68%)] max-lg:-inset-2 sm:-inset-6",
  showcaseVisualFrame:
    "relative mx-auto w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_4px_8px_rgba(15,15,15,0.04),0_24px_56px_rgba(15,15,15,0.12)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_24px_56px_rgba(0,0,0,0.45)] sm:rounded-[1.75rem]",
  showcaseVisualImg: "aspect-[5/4] w-full object-cover",

  visualFrame:
    "mx-auto w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-[2rem] lg:rounded-[2.5rem]",
  visualImgContain:
    "mx-auto block h-auto max-h-[min(40vh,320px)] w-full max-w-full object-contain object-center sm:max-h-[min(48vh,420px)] lg:max-h-none",

  /** Hospitality split */
  hospitalitySection:
    "scroll-mt-[80px] w-full min-w-0 overflow-x-hidden px-4 py-11 max-lg:pb-12 max-lg:pt-10 sm:px-6 sm:py-16 lg:py-20",
  hospitalityIntro:
    "mb-8 flex w-full flex-col items-center space-y-4 px-0.5 text-center sm:mb-9 lg:mb-10",
  hospitalityTitle:
    "mx-auto max-w-[min(100%,20ch)] text-balance text-center text-[1.4375rem] font-bold leading-[1.14] tracking-[-0.02em] text-neutral-900 max-lg:px-0.5 dark:text-neutral-100 max-md:max-w-[min(100%,22ch)] sm:text-[1.625rem] md:text-3xl md:leading-[1.1] lg:max-w-[26ch] lg:text-5xl lg:leading-[1.08]",
  hospitalitySubtitle:
    "mx-auto max-w-[min(100%,32ch)] text-pretty text-center text-[14px] font-normal leading-[1.52] text-neutral-600 max-lg:px-0.5 dark:text-neutral-400 sm:text-[15px] sm:leading-[1.55] md:text-lg lg:max-w-[36ch]",
  hospitalityGrid:
    "grid w-full min-w-0 grid-cols-1 items-center gap-8 overflow-x-hidden sm:gap-9 lg:grid-cols-2 lg:gap-12",
  hospitalityFeaturePanel:
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  hospitalityMediaStack:
    "flex w-full min-w-0 flex-col gap-3 pt-0.5 max-lg:items-center max-lg:text-center sm:gap-4 lg:items-start lg:text-left",
  hospitalityMediaLabel:
    "text-[14px] font-semibold leading-snug tracking-[0.01em] text-neutral-600 dark:text-neutral-400 sm:text-sm",
  hospitalityMediaCard:
    "w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_2px_4px_rgba(15,15,15,0.04),0_12px_32px_rgba(15,15,15,0.07)] dark:border-neutral-800/90 dark:bg-neutral-950/60 dark:shadow-[0_16px_36px_rgba(0,0,0,0.35)]",

  /** Tier 1 — cinematic hero */
  heroShell:
    "mx-auto relative z-[1] grid w-full min-w-0 max-w-7xl grid-cols-1 gap-8 overflow-x-hidden px-4 pb-6 pt-3 max-md:gap-y-5 sm:gap-9 sm:px-6 sm:pb-10 sm:pt-4 md:grid-cols-[minmax(0,min(100%,30rem))_1fr] md:items-center md:gap-8 md:px-8 md:pb-12 md:pt-4 lg:grid-cols-[minmax(0,34rem)_minmax(280px,1.05fr)] lg:gap-10 xl:gap-12",
  heroCopy:
    "order-1 flex min-w-0 w-full max-w-[34rem] flex-col items-start text-left md:max-w-[30rem] md:mx-0 lg:max-w-[34rem]",
  heroHeadlineEn:
    "max-w-[min(100%,21ch)] text-balance text-left text-[1.5rem] font-bold leading-[1.13] tracking-[-0.02em] text-gray-950 dark:text-neutral-50 sm:text-[1.625rem] sm:leading-[1.1] md:text-4xl md:leading-[1.06] lg:max-w-[21ch] lg:text-[3.15rem] xl:text-[3.25rem] lg:leading-[1.04]",
  heroHeadlineDe:
    "max-w-[min(100%,28ch)] text-balance text-left text-[1.375rem] font-bold leading-[1.13] tracking-[-0.02em] text-gray-950 dark:text-neutral-50 sm:text-[1.5rem] sm:leading-[1.1] md:max-w-[26ch] md:text-[2.35rem] md:leading-[1.08] lg:text-[2.75rem] xl:text-[2.875rem] lg:leading-[1.06]",
  heroSubtitle:
    "mt-2.5 max-w-[min(100%,36ch)] text-pretty text-left text-[14px] font-normal leading-[1.52] tracking-[-0.01em] text-neutral-600 dark:text-neutral-300 sm:mt-5 sm:text-[15px] sm:leading-[1.55] md:text-lg md:leading-[1.6] lg:max-w-[38ch]",
  heroActionCluster:
    "mt-4 flex w-full max-w-[min(100%,38ch)] flex-col gap-3 items-start sm:mt-6 sm:gap-4 md:max-w-[38ch]",
  heroBenefits: "!mt-0 w-full max-w-full gap-2.5 sm:!mt-0 sm:gap-2.5",
  heroCtaRow:
    "flex w-full max-w-full flex-col items-stretch gap-2 justify-start min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3",
  heroCtaPrimary:
    "h-9 w-full shrink-0 rounded-lg border-0 bg-[#EB992C] px-5 text-[14px] font-bold tracking-tight text-white shadow-[0_8px_22px_-10px_rgba(235,153,44,0.38)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-[#d88926] hover:shadow-[0_16px_44px_-8px_rgba(235,153,44,0.52)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#EB992C]/45 focus-visible:ring-offset-2 max-md:h-9 min-[420px]:w-auto sm:h-12 sm:min-w-[12rem] sm:rounded-xl sm:px-8 sm:text-base",
  heroCtaSecondary:
    "h-9 w-full shrink-0 rounded-lg border border-neutral-300/90 bg-white/90 px-4 text-[13px] font-semibold text-neutral-700 shadow-sm backdrop-blur-sm transition-[transform,box-shadow,background-color,border-color] duration-200 hover:border-neutral-400 hover:bg-white hover:text-neutral-900 hover:shadow-md active:scale-[0.99] dark:border-neutral-600/90 dark:bg-neutral-900/55 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/70 max-md:h-9 min-[420px]:w-auto sm:h-12 sm:min-w-[10.5rem] sm:rounded-xl sm:px-6 sm:text-[14px]",
  heroMediaCol:
    "order-2 flex min-h-0 w-full min-w-0 max-w-full items-center justify-center px-0 max-md:pt-1 md:justify-center md:self-center",
  heroMediaShell:
    "relative mx-auto w-full max-w-[min(100%,400px)] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[520px]",
  heroPhoneFrame:
    "relative mx-auto aspect-[2/3] w-full max-w-[min(90vw,300px)] overflow-hidden rounded-[clamp(22px,4.5vw,40px)] border border-neutral-200/95 bg-white shadow-[0_22px_56px_-28px_rgba(15,23,42,0.14),0_10px_28px_-16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-black/[0.04] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] sm:max-w-[340px] md:max-w-full",
} as const;
