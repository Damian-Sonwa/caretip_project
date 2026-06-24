/**
 * CareTip Hero Personality System
 * Unified premium gradient framework — unique atmosphere per dashboard area.
 * @see docs/HERO_PERSONALITY_SYSTEM.md
 */

export const HERO_PERSONALITIES = [
  "overview",
  "team",
  "tips",
  "qrStudio",
  "analytics",
  "performance",
  "billing",
  "locations",
  "employees",
  "notifications",
  "customers",
] as const;

export type HeroPersonality = (typeof HERO_PERSONALITIES)[number];

export type HeroPersonalityMeta = {
  id: HeroPersonality;
  theme: string;
  mood: string;
  accent: string;
  purpose: string;
};

export const HERO_PERSONALITY_META: Record<HeroPersonality, HeroPersonalityMeta> = {
  overview: {
    id: "overview",
    theme: "Command Center",
    mood: "Welcoming operational hub",
    accent: "Warm amber lift",
    purpose: "Business pulse, quick actions, and at-a-glance health",
  },
  team: {
    id: "team",
    theme: "People & Performance",
    mood: "Warm, leadership-focused",
    accent: "Amber + soft orange",
    purpose: "Staff, goals, performance, recognition",
  },
  tips: {
    id: "tips",
    theme: "Revenue & Activity",
    mood: "Energetic and live",
    accent: "Amber + gold",
    purpose: "Transactions, analytics, live tipping activity",
  },
  qrStudio: {
    id: "qrStudio",
    theme: "Creativity & Branding",
    mood: "Premium studio workspace",
    accent: "Orange + amber spotlight",
    purpose: "QR creation, customization, exports",
  },
  analytics: {
    id: "analytics",
    theme: "Business Intelligence",
    mood: "Data-driven executive reporting",
    accent: "Amber + champagne gold",
    purpose: "Reporting, trends, exports, insights",
  },
  performance: {
    id: "performance",
    theme: "Decision Making",
    mood: "Executive command center",
    accent: "Gold + subtle amber spotlight",
    purpose: "Health, risks, opportunities, recommendations",
  },
  billing: {
    id: "billing",
    theme: "Growth & Subscription",
    mood: "Premium account management",
    accent: "Gold + warm white glow",
    purpose: "Plan management and upgrades",
  },
  locations: {
    id: "locations",
    theme: "Operations",
    mood: "Structured and organized",
    accent: "Subtle amber highlights",
    purpose: "Venue management",
  },
  employees: {
    id: "employees",
    theme: "Workforce Management",
    mood: "Professional and collaborative",
    accent: "Amber + muted orange",
    purpose: "Staff administration",
  },
  notifications: {
    id: "notifications",
    theme: "Activity & Awareness",
    mood: "Live operational center",
    accent: "Soft amber highlights",
    purpose: "Alerts, updates, actions",
  },
  customers: {
    id: "customers",
    theme: "Guest Voice",
    mood: "Thoughtful and responsive",
    accent: "Soft amber + warm rose tint",
    purpose: "Feedback, reviews, guest sentiment",
  },
};

/** Maps personality id → BEM modifier on premium backdrop / workspace header */
export function heroPersonalityDataAttr(personality: HeroPersonality): {
  "data-hero-personality": HeroPersonality;
} {
  return { "data-hero-personality": personality };
}

export function heroPersonalityBackdropClass(personality: HeroPersonality): string {
  return `caretip-premium-backdrop__atmosphere--${personality}`;
}
