/**
 * CareTip Premium Visual Tokens
 * Orange-black gradient accents for dashboard premium layer (CSS-first, no JS effects).
 */

export const PREMIUM_GRADIENT =
  "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 40%, #EB992C 100%)";

export const PREMIUM_GLOW =
  "0 20px 50px -18px rgba(235, 153, 44, 0.38), 0 8px 24px -12px rgba(0, 0, 0, 0.45)";

export const PREMIUM_GLOW_SOFT =
  "0 12px 32px -14px rgba(235, 153, 44, 0.28), 0 4px 16px -8px rgba(0, 0, 0, 0.35)";

export const PREMIUM_CARD_RADIUS = "1.5rem";

/** Tailwind-friendly class bundles — prefer these over one-off styles. */
export const premiumVisualClasses = {
  gradientShell: "premium-gradient-shell",
  gradientSurface: "premium-gradient-surface",
  glow: "premium-glow",
  card: "premium-card",
  badge: "premium-badge",
  hero: "premium-page-hero",
  heroContent: "premium-page-hero__content",
  summaryCard: "premium-summary-card",
  planCard: "premium-plan-card",
  liveCard: "premium-live-card",
  emptyState: "premium-empty-state",
  workspaceHeader: "premium-workspace-header",
} as const;

export const premiumVisualStyle = {
  gradient: { background: PREMIUM_GRADIENT },
  glow: { boxShadow: PREMIUM_GLOW },
  glowSoft: { boxShadow: PREMIUM_GLOW_SOFT },
} as const;
