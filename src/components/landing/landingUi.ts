import { landingType } from "@/components/landing/landingTypography";

/**
 * Landing page design system — layout, spacing, typography (TipJar-inspired rhythm).
 *
 * Typography: Inter (UI/body); Manrope for landing hero H1 via `font-hero-display`.
 * Responsive rules:
 * - Phone (<md): left-aligned hero; centered section intros below lg
 * - clamp()-based type scale in `caretip-typography.css`
 */

/** Hero headline — Plus Jakarta Sans, bold, tight metrics for optical balance at display sizes. */
const heroHeadlineTone =
  "font-hero-display font-bold text-neutral-950 dark:text-neutral-50 max-lg:text-left max-lg:text-wrap lg:text-pretty antialiased";
/** Below md only — desktop uses `heroHeadlineDesktop`. */
const heroHeadlineMobile =
  "max-lg:text-[2.0625rem] max-lg:leading-[1.08] max-lg:tracking-[-0.028em]";
const heroHeadlineMobileDe =
  "max-lg:text-[2rem] max-lg:leading-[1.1] max-lg:tracking-[-0.026em]";
const heroHeadlineDesktop =
  "lg:text-[3rem] lg:leading-[1.04] lg:tracking-[-0.03em] xl:text-[3.4375rem] xl:leading-[1.02] xl:tracking-[-0.034em]";

function cnHeroHeadline(layout: string) {
  return `${heroHeadlineTone} ${heroHeadlineMobile} ${heroHeadlineDesktop} ${layout}`;
}
function cnHeroHeadlineDe(layout: string) {
  return `${heroHeadlineTone} ${heroHeadlineMobileDe} ${heroHeadlineDesktop} ${layout}`;
}
/** Shared intro/lead copy — hero subtitle + section taglines. */
const landingLeadCopy =
  "font-sans text-body-copy font-normal text-pretty tracking-[-0.01em] leading-[1.65] text-neutral-600 dark:text-neutral-400";
function cnHeroSubtitle(layout: string) {
  return `${landingLeadCopy} ${layout}`;
}

/** Clears fixed nav + ~1.75rem gap (mobile includes safe-area). */
/** Stacked hero (<lg): tighter gap below nav; split hero (lg+): original clearance. */
const heroSectionPadTop =
  "pt-[calc(5.25rem+env(safe-area-inset-top,0px)+1.4rem)] pb-2 max-lg:pb-4 lg:pt-[calc(6.75rem+2.25rem)] lg:pb-0";
/** Mobile-first stack rhythm between headline, lead, actions, and mockup. */
const heroStackGapMobile = "mt-6 md:mt-7";
const heroStackGapMediaMobile = "max-md:mt-10";
/** Section H2 — bold, balanced tracking (below hero scale). */
function cnSectionHeadline(layout: string) {
  return `${landingType.sectionHeadline} tracking-[-0.02em] ${layout}`;
}
/** Tagline / intro paragraph under section headlines — readable, not tiny. */
function cnSectionLead(layout: string) {
  return `${landingLeadCopy} ${layout}`;
}

/** Centered / split section intro — eyebrow → headline → lead rhythm. */
const sectionIntroStack =
  "caretip-section-intro flex w-full flex-col items-center space-y-0 px-0.5 text-center";
const sectionIntroChildRhythm =
  "[&>h2]:mt-3.5 [&>h2:first-child]:mt-0 [&>div~h2]:mt-4 [&>p]:mt-5 sm:[&>p]:mt-5.5 [&>motion.div]:mt-8 sm:[&>motion.div]:mt-8 [&>motion.div~*]:mt-0 [&>div.flex]:mt-8 sm:[&>div.flex]:mt-8";
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
  sectionShell: "mx-auto w-full min-w-0 max-w-7xl",
  section:
    "scroll-mt-[80px] w-full min-w-0 overflow-x-hidden px-4 py-12 max-lg:pt-12 max-lg:pb-11 sm:px-6 sm:py-16 lg:py-20",
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
  /** In-card body / quote — same scale as hero subtitle & section leads. */
  cardBodyLead: cnSectionLead("text-left"),
  cardCopyStack: "flex flex-col gap-2.5 text-left sm:gap-3",

  benefitList: "w-full space-y-3 max-lg:mt-1 max-lg:space-y-2.5 sm:space-y-3.5",
  /** Section CTAs — mobile matches `heroCtaPrimary`; prefer hero tokens on landing for parity. */
  cta: cnCtaPrimary(
    "inline-flex touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-xl border-0 bg-[#EB992C] px-7 font-sans text-[0.9375rem] font-bold !leading-none tracking-tight text-white no-underline shadow-[0_10px_26px_-10px_rgba(235,153,44,0.42)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:bg-[#d88926] max-lg:mx-auto max-lg:h-11 max-lg:min-h-11 max-lg:w-auto max-lg:min-w-[12.75rem] max-lg:max-w-[min(100%,280px)] sm:w-auto lg:h-12 lg:min-w-[12rem] lg:px-8",
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
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] max-lg:backdrop-blur-none backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  showcaseBenefits: "mt-0 w-full max-lg:self-start",
  showcaseBenefitRow: "px-3.5 py-2.5 sm:px-4 sm:py-3",
  showcaseCta: cnCtaPrimary(
    "mt-0 inline-flex self-start transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.99] lg:inline-flex",
  ),
  showcaseVisualCol:
    "flex w-full min-w-0 max-w-full flex-col items-center justify-center max-lg:max-w-lg lg:max-w-none lg:justify-self-center",
  showcaseVisualGlow:
    "pointer-events-none absolute -inset-3 rounded-[2rem] bg-[radial-gradient(ellipse_80%_70%_at_50%_55%,rgba(235,153,44,0.12),transparent_68%)] max-lg:-inset-2 sm:-inset-6",
  showcaseVisualFrame:
    "relative mx-auto w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_4px_8px_rgba(15,15,15,0.04),0_20px_48px_rgba(15,15,15,0.1)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_20px_48px_rgba(0,0,0,0.4)]",
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
    "w-full divide-y divide-neutral-900/[0.07] rounded-xl bg-white/30 ring-1 ring-inset ring-neutral-900/[0.05] max-lg:backdrop-blur-none backdrop-blur-[1px] dark:divide-white/[0.07] dark:bg-white/[0.04] dark:ring-white/[0.06]",
  hospitalityMediaStack:
    "flex w-full min-w-0 flex-col gap-3 pt-0.5 max-lg:items-center max-lg:text-center sm:gap-4 lg:items-start lg:text-left",
  hospitalityMediaCard:
    "w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_2px_4px_rgba(15,15,15,0.04),0_12px_32px_rgba(15,15,15,0.07)] dark:border-neutral-800/90 dark:bg-neutral-950/60 dark:shadow-[0_16px_36px_rgba(0,0,0,0.35)]",

  heroSectionCinematic: heroSectionPadTop,
  heroShell:
    "mx-auto relative z-[1] grid w-full min-w-0 max-w-7xl grid-cols-1 gap-9 overflow-x-hidden px-4 pb-8 pt-6 max-md:gap-y-0 sm:gap-10 sm:px-6 sm:pb-10 md:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] md:items-center md:gap-x-6 md:gap-y-0 md:px-8 md:pb-12 md:pt-7 lg:gap-x-7 xl:gap-x-8",
  heroCopy:
    "relative z-10 order-1 flex min-w-0 w-full max-w-full flex-col items-start text-left max-md:space-y-0 max-md:pt-0 md:max-w-[540px] md:space-y-0 md:pr-1 lg:pr-2 xl:pr-3",
  heroTagline: `inline-flex w-fit items-center ${landingType.tagline}`,
  heroHeadlineEn: cnHeroHeadline(
    "caretip-hero-headline caretip-hero-headline--en w-full antialiased text-left max-lg:max-w-[min(100%,19rem)] max-lg:pl-0.5 max-lg:pr-2 lg:max-w-[26ch] xl:max-w-[28ch]",
  ),
  heroHeadlineDe: cnHeroHeadlineDe(
    "w-full max-w-[28ch] antialiased text-left sm:max-w-[30ch] md:max-w-[26ch] lg:max-w-[32ch] xl:max-w-[34ch]",
  ),
  /** Brand orange emphasis — `globals.css` --headline-accent (#E79B2F); inherits headline weight. */
  heroHeadlineEmphasis: "font-inherit text-headline-accent",
  heroHeadlineLine:
    "block text-neutral-950 dark:text-neutral-50 max-lg:[&:not(:first-child)]:mt-2.5 [&:not(:first-child)]:mt-1.5 md:[&:not(:first-child)]:mt-2",
  heroSubtitle: cnHeroSubtitle(
    `w-full max-w-2xl text-left ${heroStackGapMobile} max-lg:max-w-[min(100%,21.5rem)] max-lg:text-[0.9375rem] max-lg:leading-[1.68] max-lg:pt-0 lg:pt-0 md:mt-5 md:max-w-[500px] md:pt-0`,
  ),
  heroActionCluster:
    `relative z-10 flex w-full flex-col items-start ${heroStackGapMobile} max-md:gap-0 max-md:pb-0 md:!mt-5 md:max-w-none md:gap-5`,
  heroBenefits:
    "!mt-0 w-full max-md:gap-2 max-md:[&_li]:!text-feature-copy max-md:[&_li]:!font-medium max-md:[&_li]:leading-snug max-md:[&_li>span:first-child]:!h-7 max-md:[&_li>span:first-child]:!w-7 max-md:[&_li>span:first-child]:!rounded-md max-md:[&_li_svg]:!max-h-3 max-md:[&_li_svg]:!max-w-3 md:max-w-none md:gap-2.5 md:[&_li]:!font-medium md:[&_li]:!gap-x-1.5 md:[&_li]:!text-feature-copy",
  heroCtaRow:
    "relative z-10 mt-6 flex w-full flex-col gap-3 [&_a]:no-underline max-lg:items-center max-lg:justify-center max-lg:gap-3 lg:flex-row lg:items-center lg:justify-start lg:gap-3 md:mt-0",
  heroCtaPrimary:
    "inline-flex shrink-0 touch-manipulation items-center justify-center whitespace-nowrap rounded-xl border-0 bg-[#EB992C] px-7 text-center font-sans text-[0.9375rem] font-bold !leading-none tracking-tight text-white no-underline shadow-[0_10px_26px_-10px_rgba(235,153,44,0.42)] transition-[box-shadow,background-color,opacity] duration-200 ease-out hover:bg-[#d88926] hover:shadow-[0_14px_36px_-8px_rgba(235,153,44,0.48)] active:opacity-[0.96] focus-visible:ring-2 focus-visible:ring-[#EB992C]/45 focus-visible:ring-offset-2 max-lg:mx-auto max-lg:h-11 max-lg:min-h-11 max-lg:w-auto max-lg:min-w-[12.75rem] max-lg:max-w-[min(100%,280px)] lg:h-12 lg:min-w-[12rem] lg:rounded-xl lg:px-8",
  heroCtaSecondary:
    "inline-flex shrink-0 touch-manipulation items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-300/90 bg-white/95 px-6 text-center font-sans text-[0.9375rem] font-semibold !leading-none text-neutral-700 no-underline shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-[box-shadow,background-color,border-color,opacity] duration-200 ease-out hover:border-neutral-400 hover:bg-white hover:text-neutral-900 hover:shadow-md active:opacity-[0.96] dark:border-neutral-600/90 dark:bg-neutral-900/55 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/70 max-lg:mx-auto max-lg:h-11 max-lg:min-h-11 max-lg:w-auto max-lg:min-w-[11.5rem] max-lg:max-w-[min(100%,260px)] lg:h-12 lg:min-w-[10.5rem] lg:rounded-xl lg:bg-white lg:px-6 lg:backdrop-blur-none",
  heroMediaCol:
    `relative z-0 order-2 flex min-h-0 w-full min-w-0 max-w-full items-stretch justify-center px-0 ${heroStackGapMediaMobile} max-md:pt-0 max-md:pb-0 md:mt-0 md:justify-center md:self-center`,
  heroMediaColShowcase:
    `relative z-0 order-2 flex min-h-0 w-full min-w-0 max-w-full items-stretch justify-center px-0 max-md:mt-8 max-md:pt-0 max-md:pb-0 md:mt-0 md:justify-end md:self-center`,
  /** Outer shell — shrink-wraps to showcase card / image size. */
  heroMediaShell:
    "relative mx-auto w-fit min-w-0 max-w-full overflow-hidden md:ml-auto md:mr-0 lg:ml-0 lg:mr-auto lg:h-full lg:w-full lg:max-w-none",
  heroMediaShellLegacy:
    "relative mx-auto w-full max-md:max-w-[min(100%,320px)] sm:max-w-[360px] md:max-w-[380px] lg:max-w-[400px]",
  /** Premium product showcase card (Stripe / Linear / fintech hero). */
  heroShowcaseFrame:
    "relative w-full max-w-full overflow-hidden max-lg:mx-auto max-lg:w-full lg:h-full lg:min-h-0",
  heroShowcaseStack: "hero-showcase-stack relative z-[1] h-full min-h-0 w-full overflow-hidden max-lg:h-auto",
  /** Float stats — out of flow; anchored to showcase column in CareTipLandingHero. */
  heroFloatLayer: "pointer-events-none absolute inset-0 z-30 overflow-hidden",
  /** Mobile hero — same scale/aspect as Live in Minutes demo (desktop unchanged via child tokens). */
  heroShowcaseMobileShell:
    "max-lg:[&_.hero-showcase-card-media]:rounded-[1.5rem] max-lg:[&_.hero-showcase-card-media]:shadow-[0_20px_56px_-16px_rgba(15,23,42,0.14)]",
  /** Outer frame — visible overflow so float card + shadows are not clipped. */
  heroShowcaseCard:
    "hero-showcase-card relative z-[1] block w-full max-w-full overflow-visible rounded-[28px] border border-white/60 bg-transparent p-0 leading-[0] shadow-[0_30px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] dark:border-white/10 dark:shadow-[0_30px_80px_rgba(0,0,0,0.42)] sm:rounded-[32px] max-lg:mx-auto max-lg:aspect-[3/4] max-lg:max-w-[min(100%,20rem)] max-lg:rounded-[1.5rem] sm:max-lg:max-w-[22rem] sm:max-lg:rounded-[1.5rem] lg:h-full lg:max-h-full lg:min-h-0 lg:max-w-[min(100%,44rem)] lg:overflow-hidden lg:shadow-[0_28px_72px_-24px_rgba(0,0,0,0.22)]",
  heroShowcaseCardMedia:
    "hero-showcase-card-media h-full w-full overflow-hidden rounded-[inherit] bg-neutral-950",
  heroShowcaseGlow:
    "pointer-events-none absolute -inset-6 z-0 rounded-[40px] bg-[radial-gradient(circle_at_50%_42%,rgba(235,153,44,0.16)_0%,rgba(235,153,44,0.04)_48%,transparent_72%)] blur-2xl opacity-90 max-md:-inset-4 lg:-inset-3 lg:blur-xl dark:opacity-50",
  heroShowcaseImg:
    "block h-full w-full min-h-0 select-none object-cover object-[center_38%] max-lg:object-[center_36%]",
  /** Desktop showcase — locale-specific separation so art does not collide with copy. */
  heroShowcaseDesktopColDe:
    "relative lg:flex lg:min-h-0 lg:flex-1 lg:self-stretch lg:ml-0 lg:min-w-0 lg:overflow-hidden",
  heroShowcaseDesktopColEn:
    "relative lg:flex lg:min-h-0 lg:flex-1 lg:self-stretch lg:ml-0 lg:min-w-0 lg:overflow-hidden",
  heroShowcaseDesktopStageDe:
    "flex w-full items-center justify-center max-lg:relative max-lg:px-4 max-lg:pt-2 max-lg:pb-1 sm:max-lg:px-6 sm:max-lg:pt-3 sm:max-lg:pb-2 lg:absolute lg:inset-0 lg:h-full lg:px-3 lg:py-2 lg:pt-5 xl:px-4 xl:py-3 xl:pt-6",
  heroShowcaseDesktopStageEn:
    "flex w-full items-center justify-center max-lg:relative max-lg:px-4 max-lg:pt-2 max-lg:pb-1 sm:max-lg:px-6 sm:max-lg:pt-3 sm:max-lg:pb-2 lg:absolute lg:inset-x-0 lg:bottom-8 lg:top-3 lg:flex lg:h-[calc(100%-2.75rem)] lg:items-start lg:justify-center lg:px-4 lg:py-0 xl:bottom-9 xl:top-3.5 xl:px-5",
  heroShowcaseDesktopShellDe:
    "lg:flex lg:h-full lg:min-h-0 lg:w-full lg:max-w-[min(100%,42rem)] lg:flex-1 lg:flex-col lg:justify-center lg:translate-x-0 lg:mx-auto lg:[&_img]:object-[58%_36%]",
  heroShowcaseDesktopShellEn:
    "lg:mx-auto lg:mt-0 lg:flex lg:h-full lg:min-h-0 lg:w-full lg:max-w-[min(100%,42rem)] lg:flex-1 lg:flex-col lg:justify-start lg:translate-x-0 lg:[&_img]:object-[66%_38%]",
  /** Split hero row — tight editorial gap between copy and product art. */
  heroSplitRowDesktop:
    "caretip-hero-split lg:flex-row lg:items-stretch lg:gap-0 xl:gap-2",
  heroCopyDesktopDe:
    "lg:w-[min(100%,54%)] lg:max-w-[640px] lg:flex-none lg:self-stretch lg:justify-center lg:px-8 lg:pr-8 lg:pb-10 lg:pt-[3.5rem] xl:px-10 xl:pr-10 xl:pb-11 xl:pt-[4rem]",
  heroCopyDesktopEn:
    "caretip-hero-copy--en lg:w-[min(100%,54%)] lg:max-w-[560px] lg:flex-none lg:self-stretch lg:min-h-full lg:flex-col lg:justify-between lg:px-8 lg:pr-8 lg:pb-12 lg:pt-[3rem] xl:px-10 xl:pr-10 xl:pb-[3.25rem] xl:pt-[3.5rem]",
  heroShowcaseColDesktopDe: "lg:mt-0 lg:w-[min(100%,46%)] lg:flex-1 lg:pl-2",
  heroShowcaseColDesktopEn:
    "lg:mt-0 lg:flex lg:w-[min(100%,46%)] lg:flex-1 lg:flex-col lg:justify-start lg:pb-9 lg:pl-2 lg:pt-4 xl:pb-10 xl:pt-5",
  heroPhoneFrame:
    "relative mx-auto aspect-[2/3] w-full max-w-[min(92vw,360px)] overflow-hidden rounded-[clamp(18px,3.8vw,26px)] border border-neutral-200/95 bg-white py-0 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14),0_6px_20px_-12px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-black/[0.04] max-md:aspect-[3/4] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] sm:max-w-[380px] sm:rounded-[clamp(22px,4.5vw,40px)] md:aspect-[2/3] md:max-w-full md:rounded-[clamp(22px,4.5vw,40px)]",
  /** 1:1 frame for square hero art (German glassy mockup) — cover fills without crop. */
  heroPhoneFrameSquare:
    "relative mx-auto aspect-square w-full max-w-[min(92vw,420px)] overflow-hidden rounded-[clamp(18px,3.8vw,28px)] border border-neutral-200/95 bg-[linear-gradient(180deg,#faf9f7_0%,#ffffff_42%,#f3f1ed_100%)] py-0 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14),0_6px_20px_-12px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] ring-1 ring-black/[0.04] dark:border-neutral-600/90 dark:bg-neutral-900 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] sm:max-w-[420px] sm:rounded-[clamp(22px,4.5vw,40px)] md:max-w-full md:rounded-[clamp(22px,4.5vw,40px)]",
  /** Wide frame for cinematic hero art — cover fills card at default scale. */
  heroPhoneFrameCinematic:
    "relative mx-auto aspect-[16/10] w-full max-w-[min(92vw,400px)] overflow-hidden rounded-[clamp(18px,3.8vw,28px)] border border-neutral-200/90 bg-neutral-950 py-0 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14),0_6px_20px_-12px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-black/[0.06] dark:border-neutral-700/90 dark:bg-neutral-950 dark:shadow-[0_22px_52px_-20px_rgba(0,0,0,0.45)] dark:ring-white/[0.06] sm:max-w-[380px] sm:rounded-[clamp(22px,4.5vw,40px)] md:max-w-[380px] lg:max-w-[400px]",
  heroPhoneFrameCinematicImg:
    "block h-full w-full origin-center object-cover object-center [object-position:var(--hero-object-position,center)] max-md:scale-[0.97] md:scale-[0.91]",
} as const;
