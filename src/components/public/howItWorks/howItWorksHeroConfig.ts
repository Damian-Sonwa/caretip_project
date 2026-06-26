/** Hero trust row — labels reuse existing copy namespaces where possible. */
export const HOW_IT_WORKS_HERO_TRUST_KEYS = [
  "noApp",
  "stripe",
  "liveMinutes",
  "gdpr",
] as const;

export type HowItWorksHeroTrustKey = (typeof HOW_IT_WORKS_HERO_TRUST_KEYS)[number];

export const HOW_IT_WORKS_HERO_TIMELINE_STEPS = [
  { id: "step1", icon: "signup" },
  { id: "step2", icon: "setup" },
  { id: "step3", icon: "tips" },
  { id: "step4", icon: "track" },
] as const;

export type HowItWorksHeroTimelineStepId =
  (typeof HOW_IT_WORKS_HERO_TIMELINE_STEPS)[number]["id"];
