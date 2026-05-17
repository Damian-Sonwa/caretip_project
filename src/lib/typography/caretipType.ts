/**
 * CareTip typography tokens — Inter only.
 * Sizes live in `src/styles/caretip-typography.css` (`--caretip-*` variables).
 */
export const caretipType = {
  sans: "font-sans",

  heroTitle:
    "font-sans text-hero-title font-extrabold text-balance text-neutral-950 dark:text-neutral-50",
  heroTitleDe:
    "font-sans text-hero-title-de font-extrabold text-balance text-neutral-950 dark:text-neutral-50",
  sectionTitle:
    "font-sans text-section-title font-semibold text-balance text-neutral-950 dark:text-neutral-50",
  cardTitle:
    "font-sans text-card-title font-semibold text-neutral-900 dark:text-neutral-50",
  bodyCopy:
    "font-sans text-body-copy font-normal text-pretty text-neutral-600 dark:text-neutral-400",
  bodyCopyMuted:
    "font-sans text-body-copy font-normal text-pretty text-neutral-600 dark:text-neutral-400",
  featureCopy:
    "font-sans text-feature-copy font-medium text-neutral-900 dark:text-neutral-50",
  featureCopySemibold:
    "font-sans text-feature-copy font-semibold text-neutral-900 dark:text-neutral-50",
  buttonText: "font-sans text-button-text font-semibold",
  tagline:
    "font-sans text-tagline font-semibold uppercase tracking-widest text-neutral-800 dark:text-neutral-200",
  meta: "font-sans text-meta font-semibold uppercase text-neutral-500 dark:text-neutral-400",
  pill: "font-sans text-meta font-semibold uppercase",
} as const;

/** @deprecated Use `caretipType` — kept for landing imports */
export const landingType = {
  display: caretipType.sans,
  body: caretipType.sans,
  heroHeadline: caretipType.heroTitle,
  heroHeadlineDe: caretipType.heroTitleDe,
  sectionHeadline: caretipType.sectionTitle,
  bodyLead: caretipType.bodyCopy,
  bodyLeadMuted: caretipType.bodyCopyMuted,
  cardTitle: caretipType.cardTitle,
  featureTitle: caretipType.cardTitle,
  featureLine: caretipType.featureCopy,
  featureBody: caretipType.bodyCopyMuted,
  pill: caretipType.pill,
  tagline: caretipType.tagline,
  meta: caretipType.meta,
  cta: caretipType.buttonText,
  ctaBold: `${caretipType.buttonText} font-bold`,
} as const;
