/** Shared motion tokens for the marketing landing hero (subtle, GPU-friendly). */

export const landingHeroEaseOut = [0.22, 1, 0.36, 1] as const;

/** Single-block fade-up (metrics, showcase column, legacy). */
export const landingHeroTextReveal = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: landingHeroEaseOut,
    },
  },
};

/** Headline lines — 0ms / 80ms / 160ms stagger via parent. */
export const landingHeroHeadlineStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};

export const landingHeroHeadlineLineReveal = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: landingHeroEaseOut,
    },
  },
};

/** Supporting copy — enters after headline lines. */
export const landingHeroSubtitleReveal = {
  hidden: {
    opacity: 0,
    y: 9,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: landingHeroEaseOut,
      delay: 0.28,
    },
  },
};

/** CTA cluster — minimal scale + fade. */
export const landingHeroCtaReveal = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: landingHeroEaseOut,
      delay: 0.36,
    },
  },
};

/** Page columns (copy / visual / mobile metrics). */
export const landingHeroCopyStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

/** Desktop showcase entrance — opacity only (no scale; scroll-friendly). */
export const landingHeroShowcaseEnter = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, ease: landingHeroEaseOut, delay: 0.08 },
  },
} as const;
