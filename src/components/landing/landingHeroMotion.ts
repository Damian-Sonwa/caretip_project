/** Shared motion tokens for the marketing landing hero (subtle, GPU-friendly). */

export const landingHeroEaseOut = [0.22, 1, 0.36, 1] as const;

export const landingHeroTextReveal = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(5px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: landingHeroEaseOut,
    },
  },
} as const;

export const landingHeroCopyStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
} as const;

/** Primary showcase card — slow vertical float + tiny horizontal drift */
export const landingHeroShowcaseFloat = {
  y: [0, -9, 0],
  x: [0, 4, -3, 0],
} as const;

export const landingHeroShowcaseFloatTransition = {
  duration: 8,
  repeat: Infinity,
  ease: "easeInOut" as const,
  delay: 0.85,
};

/** Ambient orange glow — atmospheric pulse/drift */
export const landingHeroGlowDrift = {
  opacity: [0.42, 0.58, 0.45],
  scale: [1, 1.035, 1],
  x: [0, 10, -6, 0],
  y: [0, -6, 5, 0],
} as const;

export const landingHeroGlowDriftTransition = {
  duration: 11,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export const landingHeroGlowDriftAlt = {
  opacity: [0.32, 0.48, 0.34],
  x: [0, -8, 5, 0],
  y: [0, 7, -5, 0],
} as const;

export const landingHeroGlowDriftAltTransition = {
  duration: 9,
  repeat: Infinity,
  ease: "easeInOut" as const,
  delay: 0.35,
};

export const landingHeroFloorShadowPulse = {
  opacity: [0.22, 0.32, 0.24],
  scaleX: [0.96, 1, 0.97],
} as const;

export const landingHeroFloorShadowTransition = {
  duration: 7.5,
  repeat: Infinity,
  ease: "easeInOut" as const,
  delay: 0.2,
};
