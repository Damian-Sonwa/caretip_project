/**
 * Shared layout tokens for public marketing pages — aligned with landing rhythm.
 */
import { caretipBtnPrimary } from "@/lib/caretipButtonSystem";

export const publicPageUi = {
  page:
    "caretip-public-page relative min-h-[100dvh] w-full min-w-0 overflow-x-hidden bg-white font-sans dark:bg-neutral-950",
  shell: "relative z-10 min-w-0",
  main:
    "mx-auto w-full min-w-0 max-w-[100rem] px-4 pb-16 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-20 lg:px-8 lg:pt-[calc(5.25rem+env(safe-area-inset-top,0px))]",
  backLink:
    "caretip-public-back-link group inline-flex w-fit cursor-pointer items-center gap-2 rounded-md py-0.5 text-sm font-semibold text-neutral-700 underline-offset-[0.2em] transition-[color,transform] duration-200 ease-out hover:-translate-x-0.5 hover:text-neutral-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-300 dark:hover:text-neutral-50 dark:focus-visible:ring-offset-neutral-950",
  header: "space-y-4 sm:space-y-5",
  title:
    "font-hero-display text-[clamp(2rem,4.8vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.03em] text-neutral-950 dark:text-neutral-50",
  subtitle:
    "max-w-2xl text-lg leading-[1.65] text-neutral-700 sm:text-xl dark:text-neutral-300",
  sectionGap: "mt-8 sm:mt-10",
  card:
    "rounded-2xl border border-neutral-200/80 bg-white/95 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/85",
  cardPad: "p-5 sm:p-6",
  insetPanel:
    "rounded-xl border border-neutral-200/70 bg-[#fafaf8] p-4 text-sm leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300",
  sectionTitle:
    "font-hero-display text-[clamp(1.5rem,3vw,1.875rem)] font-bold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50",
  cardInteractive:
    "transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_16px_40px_-12px_rgba(233,120,28,0.12)] dark:hover:border-primary/35",
  mutedBand:
    "rounded-2xl border border-neutral-200/50 bg-[#f3f1ed]/55 px-1 py-6 sm:rounded-3xl sm:px-2 sm:py-8 dark:border-neutral-800/80 dark:bg-neutral-900/40",
  ctaPanel:
    "rounded-2xl border border-neutral-200/80 bg-white p-6 text-center shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] sm:p-8 dark:border-neutral-800 dark:bg-neutral-950/90",
  ctaPrimary: `${caretipBtnPrimary} no-underline`,
  trustChip:
    "inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/95 px-3 py-1.5 text-micro font-semibold uppercase tracking-[0.14em] text-neutral-700 shadow-[0_1px_4px_rgba(15,23,42,0.04)] dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-300 sm:text-kpi-label",
  trustChipDot: "h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80",
  proseWrap: "mx-auto max-w-4xl",
  wideWrap: "mx-auto max-w-5xl",
  pricingWrap: "mx-auto max-w-7xl",
} as const;
