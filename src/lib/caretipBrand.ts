/**
 * CareTip landing primary orange — single source of truth.
 * Do not add shades outside this trio (+ white/black neutrals for UI chrome).
 */
export const CARETIP_BRAND_ORANGE = {
  light: "#ff9e2d",
  base: "#e9781c",
  hover: "#ffb04a",
} as const;

/** HSL components for Tailwind `hsl(var(--primary))` — derived from `base`. */
export const CARETIP_PRIMARY_HSL = "31 79% 51%";
export const CARETIP_PRIMARY_HOVER_HSL = "38 94% 59%";
