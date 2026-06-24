/**
 * CareTip Premium Visual Tokens
 * Mirrors `src/styles/caretip-premium-visual.css` — Final CTA is source of truth.
 */

/** Vertical warm band — lifted with subtle orange warmth */
export const CARETIP_PREMIUM_BG = "#100e0b";

export const CARETIP_PREMIUM_GRADIENT =
  "linear-gradient(180deg, #1e1813 0%, #1a1410 28%, #16100d 55%, #120e0b 78%, #100e0b 100%)";

export const CARETIP_PREMIUM_GRADIENT_DARK =
  "linear-gradient(180deg, #111010 0%, #0c0c0c 42%, #0a0a0a 78%, #090909 100%)";

/** CTA primary button gradient */
export const CARETIP_PREMIUM_CTA_GRADIENT =
  "linear-gradient(180deg, #ff9e2d 0%, #e9781c 48%, #d96f18 100%)";

export const CARETIP_PREMIUM_ORANGE = "#e9781c";

export const CARETIP_PREMIUM_SHADOW =
  "0 20px 50px -18px rgba(233, 120, 28, 0.38), 0 8px 24px -12px rgba(0, 0, 0, 0.45)";

/** @deprecated Use CARETIP_PREMIUM_GRADIENT */
export const PREMIUM_GRADIENT = CARETIP_PREMIUM_GRADIENT;

export const PREMIUM_GLOW = CARETIP_PREMIUM_SHADOW;

export const PREMIUM_GLOW_SOFT =
  "0 12px 32px -14px rgba(233, 120, 28, 0.28), 0 4px 16px -8px rgba(0, 0, 0, 0.35)";

export const PREMIUM_CARD_RADIUS = "1.5rem";

/** Canonical CSS custom properties */
export const caretipPremiumCssVars = {
  bg: "--caretip-premium-bg",
  gradient: "--caretip-premium-gradient",
  glow: "--caretip-premium-glow",
  border: "--caretip-premium-border",
  shadow: "--caretip-premium-shadow",
  ctaGradient: "--caretip-premium-cta-gradient",
  orange: "--caretip-premium-orange",
} as const;

/** Tailwind-friendly class bundles */
export const premiumVisualClasses = {
  surface: "caretip-premium-surface",
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
  glassSurface: "premium-glass-surface",
  glassSurfaceOnLight: "premium-glass-surface premium-glass-surface--on-light",
  ctaButton: "caretip-premium-cta-button",
} as const;

export const premiumVisualStyle = {
  gradient: { background: CARETIP_PREMIUM_GRADIENT },
  glow: { boxShadow: CARETIP_PREMIUM_SHADOW },
  glowSoft: { boxShadow: PREMIUM_GLOW_SOFT },
} as const;
