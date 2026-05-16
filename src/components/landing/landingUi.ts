import { landingType } from "@/components/landing/landingTypography";

/**
 * Landing page design system — layout, spacing, typography (TipJar-inspired rhythm).
 *
 * Typography: Inter only via `landingType` / `caretip-typography.css` tokens.
 * Responsive rules:
 * - Phone (<md): left-aligned hero; centered section intros below lg
 * - clamp()-based type scale in `caretip-typography.css`
 */

/** Hero headline — premium scale, lighter weight than extrabold (Stripe/Linear feel). */
const heroHeadlineTone =
  "font-sans font-bold text-balance tracking-[-0.02em] text-neutral-950 dark:text-neutral-50";
const heroHeadlineMobile =
  "max-lg:text-[clamp(2.5rem,9.25vw,3.5rem)] max-lg:leading-[0.95]";
const heroHeadlineMobileDe =
  "max-lg:text-[clamp(2.35rem,8.75vw,3.3rem)] max-lg:leading-[0.95]";
const heroHeadlineDesktop =
  "md:text-5xl lg:text-6xl md:leading-[0.95] lg:leading-[0.95]";

function cnHeroHeadline(layout: string) {
  return `${heroHeadlineTone} ${heroHeadlineMobile} ${heroHeadlineDesktop} ${layout}`;
}
function cnHeroHeadlineDe(layout: string) {
  return `${heroHeadlineTone} ${heroHeadlineMobileDe} ${heroHeadlineDesktop} ${layout}`;
}
function cnHeroSubtitle(layout: string) {
  return `font-sans font-normal text-pretty tracking-[-0.01em] text-neutral-600 dark:text-neutral-400 max-lg:text-lg max-lg:leading-[1.72] md:text-lg md:font-medium md:leading-[1.7] md:text-zinc-700 md:dark:text-zinc-300 lg:text-xl lg:leading-[1.68] ${layout}`;
}
/** Section H2 — bold, balanced tracking (below hero scale). */
function cnSectionHeadline(layout: string) {
  return `${landingType.sectionHeadline} tracking-[-0.02em] ${layout}`;
}
/** Tagline / intro paragraph under section headlines — readable, not tiny. */
function cnSectionLead(layout: string) {
  return `font-sans text-body-copy font-normal text-pretty tracking-[-0.01em] text-neutral-600 max-lg:text-lg max-lg:leading-[1.68] dark:text-neutral-400 ${layout}`;
}
function cnBodyLead(layout: string) {
  return `${landingType.bodyLead} ${layout}`;
}
function cnBodyLeadMuted(layout: string) {
  return `${landingType.bodyLeadMuted} ${layout}`;
}
function cnCardTitle(layout: string) {
  return `${landingType.cardTitle} ${layout}`;
}
function cnFeatureTitle(layout: string) {
  return `${landingType.featureTitle} ${layout}`;
}
function cnCtaPrimary(layout: string) {
  return `${landingType.cta} ${layout}`;
}
function cnCtaBold(layout: string) {
  return `${landingType.ctaBold} ${layout}`;
}
function cnCta(layout: string) {
  return `${landingType.cta} ${layout}`;
}

export const landingUi = {
  section:
    "scroll-mt-[80px] w-full min-w-0 overflow-x-hidden px-4 py-11 max-lg:pt-12 max-lg:pb-10 sm:px-6 sm:py-16 lg:py-20",
  sectionMuted: "bg-gray-50 dark:bg-neutral-900",
  sectionWhite: "bg-white dark:bg-neutral-950",

  /** Eyebrow → headline → tagline stack (centered sections). */
  sectionIntro:
    "mb-8 flex w-full max-w-full flex-col items-center space-y-4 px-0.5 text-center max-lg:mb-9 sm:mb-9 sm:space-y-5 lg:mb-10",
  sectionAfterIntro: "mb-8 max-lg:mb-8 sm:mb-9",

  splitGrid:
    "mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-start gap-7 overflow-x-hidden max-lg:gap-7 sm:gap-9 lg:grid-cols-2 lg:items-center lg:gap-12",
  copyColumn:
    "order-1 flex w-full min-w-0 flex-col items-start text-left max-lg:items-center max-lg:text-center max-lg:space-y-4 lg:max-w-none",
  visualColumn:
    "order-2 flex w-full min-w-0 max-w-full flex-col items-center justify-center max-lg:pt-1 lg:order-none",

  pillRow:
    "flex w-full flex-wrap items-center justify-center gap-2 max-lg:justify-center lg:justify-start",
  pill: `inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 ${landingType.pill} text-primary max-lg:mx-auto lg:mx-0 sm:px-3 sm:py-1`,

  copyStack:
    "flex w-full flex-col items-start space-y-4 max-lg:items-center max-lg:text-center sm:space-y-5 lg:items-start lg:text-left",
  eyebrowSecondary: cnSectionLead(
    "text-neutral-600 dark:text-neutral-400 max-lg:text-center sm:text-left",
  ),
  headline: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-0.5 max-md:max-w-[min(100%,24ch)] lg:mx-0 lg:max-w-[26ch] lg:text-left",
  ),
  subtitle: cnSectionLead(
    "mx-auto max-w-[min(100%,36ch)] text-center max-lg:px-0.5 lg:mx-0 lg:max-w-[38ch] lg:text-left",
  ),
  cardFeatureBody: `${landingType.featureBody} mt-2 sm:mt-2.5 text-neutral-700 dark:text-neutral-300`,
  cardCopyStack: "flex flex-col gap-2.5 text-left sm:gap-3",

  benefitList: "w-full space-y-3 max-lg:mt-1 max-lg:space-y-2.5 sm:space-y-3.5",
  cta: cnCtaPrimary(
    "inline-flex h-10 min-h-10 w-full max-w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-white shadow-[0_6px_18px_rgba(235,153,44,0.26)] transition-colors hover:bg-primary/90 sm:w-auto sm:min-w-[11rem] sm:rounded-xl sm:px-6",
  ),

  sectionTitle: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-1 max-md:max-w-[min(100%,24ch)] sm:max-w-2xl lg:max-w-3xl",
  ),
  sectionSubtitle: cnSectionLead(
    "mx-auto max-w-[min(100%,36ch)] text-center max-lg:px-1 sm:max-w-[38ch] lg:max-w-2xl",
  ),

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
    "flex w-full flex-col items-start space-y-4 max-lg:items-center max-lg:text-center sm:space-y-5 lg:items-start lg:text-left",
  showcaseHeadline: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-0.5 max-md:max-w-[min(100%,24ch)] lg:mx-0 lg:max-w-[26ch] lg:text-left",
  ),
  showcaseHeadlineAccent: "mt-1 block text-primary max-md:mt-1 sm:mt-1.5 lg:mt-2",
  showcaseSubtitle: cnSectionLead(
    "mx-auto max-w-[min(100%,36ch)] text-center max-lg:px-0.5 lg:mx-0 lg:max-w-[38ch] lg:text-left",
  ),
  showcaseActionCluster:
    "mt-6 flex w-full min-w-0 flex-col gap-4 max-lg:items-start sm:mt-7 sm:gap-4 lg:mx-0 lg:max-w-none",
  showcaseBenefitsPanel:
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  showcaseBenefits: "mt-0 w-full max-lg:self-start",
  showcaseBenefitRow: "px-3.5 py-2.5 sm:px-4 sm:py-3",
  showcaseCta: cnCtaPrimary(
    "mt-0 inline-flex h-10 min-h-10 w-full self-start px-5 shadow-[0_6px_18px_rgba(235,153,44,0.26)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-primary/90 hover:shadow-[0_12px_34px_rgba(235,153,44,0.38)] active:scale-[0.99] sm:w-auto sm:min-w-[11rem] sm:px-6 lg:inline-flex",
  ),
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

  hospitalitySection:
    "scroll-mt-[80px] w-full min-w-0 overflow-x-hidden px-4 py-11 max-lg:pb-12 max-lg:pt-10 sm:px-6 sm:py-16 lg:py-20",
  hospitalityIntro:
    "mb-8 flex w-full flex-col items-center space-y-4 px-0.5 text-center max-lg:mb-9 sm:mb-9 sm:space-y-5 lg:mb-10",
  hospitalityTitle: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-0.5 max-md:max-w-[min(100%,24ch)] lg:max-w-[28ch]",
  ),
  hospitalitySubtitle: cnSectionLead(
    "mx-auto max-w-[min(100%,36ch)] text-center max-lg:px-0.5 lg:max-w-[40ch]",
  ),
  hospitalityGrid:
    "grid w-full min-w-0 grid-cols-1 items-center gap-8 overflow-x-hidden sm:gap-9 lg:grid-cols-2 lg:gap-12",
  hospitalityFeaturePanel:
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  hospitalityMediaStack:
    "flex w-full min-w-0 flex-col gap-3 pt-0.5 max-lg:items-center max-lg:text-center sm:gap-4 lg:items-start lg:text-left",
  hospitalityMediaLabel: cnCardTitle(
    "text-neutral-600 dark:text-neutral-400",
  ),
  hospitalityMediaCard:
    "w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_2px_4px_rgba(15,15,15,0.04),0_12px_32px_rgba(15,15,15,0.07)] dark:border-neutral-800/90 dark:bg-neutral-950/60 dark:shadow-[0_16px_36px_rgba(0,0,0,0.35)]",

  heroShell:
    "mx-auto relative z-[1] grid w-full min-w-0 max-w-7xl grid-cols-1 gap-9 overflow-x-hidden px-4 pb-6 pt-3 max-md:gap-y-6 sm:gap-10 sm:px-6 sm:pb-10 sm:pt-4 md:grid-cols-12 md:items-center md:gap-x-8 md:gap-y-0 md:px-8 md:pb-12 md:pt-4 lg:gap-x-10 xl:gap-x-12",
  heroCopy:
    "relative z-10 order-1 flex min-w-0 w-full max-w-full flex-col items-start space-y-7 text-left max-md:space-y-8 md:col-span-7 md:max-w-[620px] md:space-y-8 md:pr-2 lg:col-span-7 lg:pr-4 xl:col-span-7",
  heroTagline: `inline-flex w-fit items-center ${landingType.tagline}`,
  heroHeadlineEn: cnHeroHeadline(
    "w-full max-w-xl antialiased text-left md:max-w-none",
  ),
  heroHeadlineDe: cnHeroHeadlineDe(
    "w-full max-w-xl antialiased text-left md:max-w-none",
  ),
  heroSubtitle: cnHeroSubtitle(
    "w-full max-w-2xl text-left pt-1 max-lg:pt-1.5 md:max-w-none md:pt-2",
  ),
  heroActionCluster:
    "relative z-10 flex w-full flex-col items-start gap-7 max-md:gap-7 max-md:pb-0 max-md:!mt-0 md:!mt-10 md:max-w-none md:gap-8",
  heroBenefits:
    "!mt-0 w-full gap-3.5 max-md:gap-4 [&_li]:max-lg:text-base [&_li]:max-lg:leading-snug md:max-w-none md:gap-4",
  heroCtaRow:
    "relative z-10 flex w-full max-w-full flex-col items-stretch gap-3 justify-start max-md:gap-3.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3",
  heroCtaPrimary:
    "h-9 w-full shrink-0 rounded-lg border-0 bg-[#EB992C] px-5 font-sans text-button-text font-bold tracking-tight text-white shadow-[0_8px_22px_-10px_rgba(235,153,44,0.38)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-[#d88926] hover:shadow-[0_16px_44px_-8px_rgba(235,153,44,0.52)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#EB992C]/45 focus-visible:ring-offset-2 max-md:h-9 min-[420px]:w-auto sm:h-12 sm:min-w-[12rem] sm:rounded-xl sm:px-8",
  heroCtaSecondary:
    "h-9 w-full shrink-0 rounded-lg border border-neutral-300/90 bg-white/90 px-4 font-sans text-button-text font-semibold text-neutral-700 shadow-sm backdrop-blur-sm transition-[transform,box-shadow,background-color,border-color] duration-200 hover:border-neutral-400 hover:bg-white hover:text-neutral-900 hover:shadow-md active:scale-[0.99] dark:border-neutral-600/90 dark:bg-neutral-900/55 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/70 max-md:h-9 min-[420px]:w-auto sm:h-12 sm:min-w-[10.5rem] sm:rounded-xl sm:px-6",
  heroMediaCol:
    "relative z-0 order-2 flex min-h-0 w-full min-w-0 max-w-full items-center justify-center px-0 max-md:pt-0 max-md:pb-0 md:col-span-5 md:justify-center md:self-center lg:col-span-5",
  heroMediaShell:
    "relative mx-auto w-full max-md:max-w-[min(100%,340px)] sm:max-w-[360px] md:max-w-[400px] lg:max-w-[440px]",
  heroPhoneFrame:
    "relative mx-auto aspect-[2/3] w-full max-w-[min(92vw,332px)] overflow-hidden rounded-[clamp(20px,4.2vw,28px)] border border-neutral-200/95 bg-white py-0 shadow-[0_18px_48px_-26px_rgba(15,23,42,0.14),0_8px_24px_-14px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-black/[0.04] max-md:aspect-[4/5] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] sm:max-w-[340px] sm:rounded-[clamp(22px,4.5vw,40px)] md:aspect-[2/3] md:max-w-full md:rounded-[clamp(22px,4.5vw,40px)]",
} as const;
