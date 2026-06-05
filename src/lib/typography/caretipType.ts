/**
 * CareTip typography tokens.
 *
 * Sizes live in `src/styles/caretip-typography.css` (`--caretip-*` and `--type-*` aliases).
 * Hierarchy: hero → section → app-title → app-subtitle → card-title → body → feature → meta/micro.
 *
 * @see TYPOGRAPHY_HIERARCHY.md
 * @see TYPOGRAPHY_INVENTORY.md
 */
export const caretipType = {
  sans: "font-sans",

  heroTitle:
    "font-hero-display text-hero-title font-bold text-balance text-neutral-950 dark:text-neutral-50",
  heroTitleDe:
    "font-hero-display text-hero-title-de font-bold text-balance text-neutral-950 dark:text-neutral-50",
  sectionTitle:
    "font-sans text-section-title font-semibold text-balance text-neutral-950 dark:text-neutral-50",
  appTitle:
    "font-sans text-app-title font-bold text-neutral-950 dark:text-neutral-50",
  appSubtitle:
    "font-sans text-app-subtitle font-semibold text-neutral-900 dark:text-neutral-50",
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
  micro: "font-sans text-micro font-semibold uppercase",
  caption: "font-sans text-caption font-normal",

  /** Dashboard KPI label — 11px (`text-kpi-label`), uppercase in layout. */
  kpiLabel: "font-sans text-kpi-label font-medium uppercase tracking-wide text-muted-foreground",
  /**
   * Dashboard KPI value — uses Tailwind theme steps (no custom utility size).
   * @see src/styles/tailwind.css `--text-lg` / `--text-xl` / `--text-2xl`
   */
  kpiValue:
    "shrink-0 hyphens-auto break-words text-balance text-lg font-bold tabular-nums leading-snug text-foreground sm:text-xl md:text-2xl",
} as const;

/**
 * Semantic role aliases — same classes as `caretipType`; use for new code and audits.
 * Prefer these names when documenting hierarchy (no separate visual scale).
 */
export const type = {
  displayHero: caretipType.heroTitle,
  displayHeroDe: caretipType.heroTitleDe,
  section: caretipType.sectionTitle,
  appTitle: caretipType.appTitle,
  appSubtitle: caretipType.appSubtitle,
  cardTitle: caretipType.cardTitle,
  body: caretipType.bodyCopy,
  bodyMuted: caretipType.bodyCopyMuted,
  feature: caretipType.featureCopy,
  featureSemibold: caretipType.featureCopySemibold,
  button: caretipType.buttonText,
  tagline: caretipType.tagline,
  meta: caretipType.meta,
  micro: caretipType.micro,
  caption: caretipType.caption,
  kpiLabel: caretipType.kpiLabel,
  kpiValue: caretipType.kpiValue,
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
  featureCopy: caretipType.featureCopy,
  featureCopySemibold: caretipType.featureCopySemibold,
  bodyCopyMuted: caretipType.bodyCopyMuted,
  featureLine: caretipType.featureCopy,
  featureBody: caretipType.bodyCopyMuted,
  pill: caretipType.pill,
  tagline: caretipType.tagline,
  meta: caretipType.meta,
  cta: caretipType.buttonText,
  ctaBold: `${caretipType.buttonText} font-bold`,
} as const;
