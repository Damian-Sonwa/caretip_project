import { landingType } from "@/components/landing/landingTypography";

/**
 * Landing page design system — layout, spacing, typography (TipJar-inspired rhythm).
 *
 * Typography: Inter only via `landingType` / `caretip-typography.css` tokens.
 * Responsive rules:
 * - Phone (<md): left-aligned hero; centered section intros below lg
 * - clamp()-based type scale in `caretip-typography.css`
 */

/** Hero headline — editorial scale, restrained weight (Stripe/Linear feel). */
const heroHeadlineTone =
  "font-sans font-semibold text-balance text-neutral-950 dark:text-neutral-50";
/** Below md only — desktop uses `heroHeadlineDesktop`. */
const heroHeadlineMobile =
  "max-md:text-[3rem] max-md:font-semibold max-md:leading-[0.92] max-md:tracking-[-0.04em]";
const heroHeadlineMobileDe =
  "max-md:text-[2.875rem] max-md:font-semibold max-md:leading-[0.92] max-md:tracking-[-0.04em]";
const heroHeadlineDesktop =
  "md:text-5xl md:font-semibold md:leading-[0.94] md:tracking-[-0.03em] lg:text-6xl lg:leading-[0.95] lg:tracking-[-0.03em]";

function cnHeroHeadline(layout: string) {
  return `${heroHeadlineTone} ${heroHeadlineMobile} ${heroHeadlineDesktop} ${layout}`;
}
function cnHeroHeadlineDe(layout: string) {
  return `${heroHeadlineTone} ${heroHeadlineMobileDe} ${heroHeadlineDesktop} ${layout}`;
}
function cnHeroSubtitle(layout: string) {
  return `font-sans font-normal text-pretty tracking-[-0.01em] text-neutral-600 dark:text-neutral-400 md:text-lg md:leading-[1.72] md:text-zinc-700 md:dark:text-zinc-300 lg:text-xl lg:leading-[1.7] ${layout}`;
}
/** Section H2 — bold, balanced tracking (below hero scale). */
function cnSectionHeadline(layout: string) {
  return `${landingType.sectionHeadline} tracking-[-0.02em] ${layout}`;
}
/** Tagline / intro paragraph under section headlines — readable, not tiny. */
function cnSectionLead(layout: string) {
  return `font-sans text-body-copy font-normal text-pretty tracking-[-0.01em] text-neutral-600 max-lg:text-lg max-lg:leading-[1.65] dark:text-neutral-400 ${layout}`;
}

/** Centered / split section intro — eyebrow → headline → lead rhythm. */
const sectionIntroStack = "flex w-full flex-col items-center space-y-0 px-0.5 text-center";
const sectionIntroChildRhythm =
  "[&>h2]:mt-3 [&>h2:first-child]:mt-0 [&>div~h2]:mt-4 [&>p]:mt-5 sm:[&>p]:mt-6 [&>motion.div]:mt-8 sm:[&>motion.div]:mt-10 [&>motion.div]:sm:mt-10 [&>motion.div~*]:mt-0 [&>div.flex]:mt-8 sm:[&>motion.div]:mt-8";
/** Narrower centered body copy — headlines stay wider via section title tokens. */
const sectionLeadReadable =
  "mx-auto w-full max-w-lg max-lg:leading-[1.65] sm:max-w-xl";
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
  sectionIntro: `${sectionIntroStack} ${sectionIntroChildRhythm} mb-8 w-full max-w-full sm:mb-10`,
  sectionAfterIntro: "mb-8 sm:mb-10",

  splitGrid:
    "mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-start gap-7 overflow-x-hidden max-lg:gap-7 sm:gap-9 lg:grid-cols-2 lg:items-center lg:gap-12",
  copyColumn:
    "order-1 flex w-full min-w-0 flex-col items-start text-left max-lg:items-center max-lg:text-center max-lg:space-y-4 lg:max-w-none",
  visualColumn:
    "order-2 flex w-full min-w-0 max-w-full flex-col items-center justify-center max-lg:pt-1 lg:order-none",

  /** Row of lightweight section accents (replaces pill chips). */
  sectionAccentRow:
    "flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 max-lg:justify-center lg:justify-start",
  sectionAccent: "relative inline-flex w-fit items-center gap-2 max-lg:mx-auto lg:mx-0",
  sectionAccentText:
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-500",
  sectionAccentTextMuted:
    "text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600 dark:text-neutral-400",
  sectionAccentIcon:
    "h-3 w-3 shrink-0 text-amber-500/90 dark:text-amber-400/85",
  sectionAccentIconMuted:
    "h-3 w-3 shrink-0 text-neutral-500/90 dark:text-neutral-500",
  sectionAccentGlow:
    "pointer-events-none absolute -inset-x-4 -inset-y-2 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(235,153,44,0.16),transparent_72%)] opacity-70 blur-md",
  sectionAccentLine:
    "h-px w-6 shrink-0 bg-gradient-to-r from-amber-600/70 via-amber-500/35 to-transparent",

  copyStack: `flex w-full flex-col items-start max-lg:items-center max-lg:text-center lg:items-start lg:text-left ${sectionIntroChildRhythm}`,
  eyebrowSecondary: cnSectionLead(
    `${sectionLeadReadable} text-neutral-600 max-lg:text-center sm:text-left lg:mx-0 lg:max-w-md lg:text-left dark:text-neutral-400`,
  ),
  headline: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-0.5 max-md:max-w-[min(100%,24ch)] lg:mx-0 lg:max-w-[26ch] lg:text-left",
  ),
  subtitle: cnSectionLead(
    `${sectionLeadReadable} text-center max-lg:px-0.5 lg:mx-0 lg:max-w-md lg:text-left`,
  ),
  cardFeatureBody: `${landingType.featureBody} mt-2 leading-snug sm:mt-2.5 text-neutral-700 dark:text-neutral-300`,
  cardCopyStack: "flex flex-col gap-2.5 text-left sm:gap-3",

  benefitList: "w-full space-y-3 max-lg:mt-1 max-lg:space-y-2.5 sm:space-y-3.5",
  cta: cnCtaPrimary(
    "inline-flex h-10 min-h-10 w-full max-w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-white shadow-[0_6px_18px_rgba(235,153,44,0.26)] transition-colors hover:bg-primary/90 sm:w-auto sm:min-w-[11rem] sm:rounded-xl sm:px-6",
  ),

  sectionTitle: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-1 max-md:max-w-[min(100%,24ch)] sm:max-w-2xl lg:max-w-3xl",
  ),
  sectionSubtitle: cnSectionLead(
    `${sectionLeadReadable} text-center max-lg:px-1`,
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
  showcaseIntro: `flex w-full flex-col items-start max-lg:items-center max-lg:text-center lg:items-start lg:text-left ${sectionIntroChildRhythm}`,
  showcaseHeadline: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-0.5 max-md:max-w-[min(100%,24ch)] lg:mx-0 lg:max-w-[26ch] lg:text-left",
  ),
  showcaseHeadlineAccent: "mt-1 block text-primary max-md:mt-1 sm:mt-1.5 lg:mt-2",
  showcaseSubtitle: cnSectionLead(
    `${sectionLeadReadable} text-center max-lg:px-0.5 lg:mx-0 lg:max-w-md lg:text-left`,
  ),
  showcaseActionCluster:
    "mt-8 flex w-full min-w-0 flex-col gap-4 max-lg:items-start sm:mt-10 sm:gap-4 lg:mx-0 lg:max-w-none",
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
  hospitalityIntro: `${sectionIntroStack} ${sectionIntroChildRhythm} mb-8 w-full sm:mb-10`,
  hospitalityTitle: cnSectionHeadline(
    "mx-auto max-w-[min(100%,22ch)] text-center max-lg:px-0.5 max-md:max-w-[min(100%,24ch)] sm:max-w-2xl lg:max-w-[28ch]",
  ),
  hospitalitySubtitle: cnSectionLead(
    `${sectionLeadReadable} text-center max-lg:px-0.5`,
  ),
  hospitalityGrid:
    "grid w-full min-w-0 grid-cols-1 items-center gap-8 overflow-x-hidden sm:gap-9 lg:grid-cols-2 lg:gap-12",
  hospitalityFeaturePanel:
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  hospitalityMediaStack:
    "flex w-full min-w-0 flex-col gap-3 pt-0.5 max-lg:items-center max-lg:text-center sm:gap-4 lg:items-start lg:text-left",
  hospitalityMediaCard:
    "w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_2px_4px_rgba(15,15,15,0.04),0_12px_32px_rgba(15,15,15,0.07)] dark:border-neutral-800/90 dark:bg-neutral-950/60 dark:shadow-[0_16px_36px_rgba(0,0,0,0.35)]",

  heroShell:
    "mx-auto relative z-[1] grid w-full min-w-0 max-w-7xl grid-cols-1 gap-9 overflow-x-hidden px-4 pb-6 pt-3 max-md:gap-y-0 sm:gap-10 sm:px-6 sm:pb-10 sm:pt-4 md:grid-cols-12 md:items-center md:gap-x-8 md:gap-y-0 md:px-8 md:pb-12 md:pt-4 lg:gap-x-10 xl:gap-x-12",
  heroCopy:
    "relative z-10 order-1 flex min-w-0 w-full max-w-full flex-col items-start text-left max-md:space-y-0 md:col-span-7 md:max-w-[620px] md:space-y-7 md:pr-2 lg:col-span-7 lg:space-y-8 lg:pr-4 xl:col-span-7",
  heroTagline: `inline-flex w-fit items-center ${landingType.tagline}`,
  heroHeadlineEn: cnHeroHeadline(
    "w-full max-w-xl max-md:max-w-[min(300px,24ch)] antialiased text-left md:max-w-none",
  ),
  heroHeadlineDe: cnHeroHeadlineDe(
    "w-full max-w-xl max-md:max-w-[min(288px,23ch)] antialiased text-left md:max-w-none",
  ),
  heroSubtitle: cnHeroSubtitle(
    "w-full max-w-2xl text-left max-md:mt-6 max-md:max-w-[min(300px,32ch)] max-md:text-[1.05rem] max-md:leading-[1.7] max-lg:pt-0 md:max-w-xl md:pt-1 md:mt-0",
  ),
  heroActionCluster:
    "relative z-10 flex w-full flex-col items-start max-md:mt-8 max-md:gap-0 max-md:pb-0 md:!mt-10 md:max-w-none md:gap-7",
  heroBenefits:
    "!mt-0 w-full max-md:gap-2 max-md:[&_li]:!text-[0.9375rem] max-md:[&_li]:!font-normal max-md:[&_li]:leading-snug max-md:[&_li>span:first-child]:!h-7 max-md:[&_li>span:first-child]:!w-7 max-md:[&_li>span:first-child]:!rounded-md max-md:[&_li_svg]:!max-h-3 max-md:[&_li_svg]:!max-w-3 md:max-w-none md:gap-3.5 md:[&_li]:!font-normal md:[&_li]:text-[0.9375rem]",
  heroCtaRow:
    "relative z-10 mt-8 flex w-full max-w-full flex-col items-stretch justify-start gap-3 max-md:mt-8 max-md:gap-2.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3 md:mt-0",
  heroCtaPrimary:
    "h-9 w-full shrink-0 rounded-lg border-0 bg-[#EB992C] px-5 font-sans text-button-text font-bold tracking-tight text-white shadow-[0_8px_22px_-10px_rgba(235,153,44,0.38)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-[#d88926] hover:shadow-[0_16px_44px_-8px_rgba(235,153,44,0.52)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#EB992C]/45 focus-visible:ring-offset-2 max-md:h-auto max-md:min-h-[2.5rem] max-md:rounded-xl max-md:px-5 max-md:py-3.5 min-[420px]:w-auto sm:h-12 sm:min-w-[12rem] sm:rounded-xl sm:px-8",
  heroCtaSecondary:
    "h-9 w-full shrink-0 rounded-lg border border-neutral-300/90 bg-white/90 px-4 font-sans text-button-text font-semibold text-neutral-700 shadow-sm backdrop-blur-sm transition-[transform,box-shadow,background-color,border-color] duration-200 hover:border-neutral-400 hover:bg-white hover:text-neutral-900 hover:shadow-md active:scale-[0.99] dark:border-neutral-600/90 dark:bg-neutral-900/55 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/70 max-md:h-auto max-md:min-h-[2.375rem] max-md:rounded-xl max-md:px-5 max-md:py-3 min-[420px]:w-auto sm:h-12 sm:min-w-[10.5rem] sm:rounded-xl sm:px-6",
  heroMediaCol:
    "relative z-0 order-2 flex min-h-0 w-full min-w-0 max-w-full items-center justify-center px-0 max-md:mt-11 max-md:pt-0 max-md:pb-0 md:col-span-5 md:mt-0 md:justify-center md:self-center lg:col-span-5",
  heroMediaShell:
    "relative mx-auto w-full max-md:max-w-[min(100%,340px)] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px]",
  heroPhoneFrame:
    "relative mx-auto aspect-[2/3] w-full max-w-[min(92vw,360px)] overflow-hidden rounded-[clamp(18px,3.8vw,26px)] border border-neutral-200/95 bg-white py-0 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14),0_6px_20px_-12px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-black/[0.04] max-md:aspect-[3/4] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] sm:max-w-[380px] sm:rounded-[clamp(22px,4.5vw,40px)] md:aspect-[2/3] md:max-w-full md:rounded-[clamp(22px,4.5vw,40px)]",
  /** 1:1 frame for square hero art (German glassy mockup) — cover fills without crop. */
  heroPhoneFrameSquare:
    "relative mx-auto aspect-square w-full max-w-[min(92vw,420px)] overflow-hidden rounded-[clamp(18px,3.8vw,28px)] border border-neutral-200/95 bg-[linear-gradient(180deg,#faf9f7_0%,#ffffff_42%,#f3f1ed_100%)] py-0 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14),0_6px_20px_-12px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-black/[0.04] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] sm:max-w-[420px] sm:rounded-[clamp(22px,4.5vw,40px)] md:max-w-full md:rounded-[clamp(22px,4.5vw,40px)]",
} as const;
