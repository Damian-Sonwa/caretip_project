/**
 * CareTip Premium UI Design System v2.0
 * =======================================
 * Enhanced design system with premium gradients and 3D visuals
 * while maintaining core brand identity (Orange, White, Black)
 */

// ============================================
// BRAND COLORS (PRIMARY)
// ============================================
export const BRAND_COLORS = {
  PRIMARY_ORANGE: "#EB992C",
  WHITE: "#FFFFFF",
  BLACK: "#000000",
} as const;

// ============================================
// PREMIUM GRADIENTS
// ============================================
export const PREMIUM_GRADIENTS = {
  // Orange family gradients
  ORANGE_WARM: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
  ORANGE_CREAM: "linear-gradient(135deg, #EB992C 0%, #FFF7ED 100%)",
  ORANGE_SOFT: "linear-gradient(135deg, #FB923C 0%, #FED7AA 100%)",
  
  // Neutral family gradients (premium backgrounds)
  CREAM_WHITE: "linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)",
  WARM_NEUTRAL: "linear-gradient(135deg, #F5F3FF 0%, #FFF7ED 100%)",
  SOFT_LIGHT: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
  
  // Dark/charcoal gradients (for headers/banners)
  DARK_WARM: "linear-gradient(135deg, #1F2937 0%, #374151 100%)",
  CHARCOAL_ORANGE: "linear-gradient(135deg, #1F2937 0%, rgba(235, 153, 44, 0.15) 100%)",
  
  // Emerald/Success gradients
  EMERALD_SOFT: "linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)",
  
  // Elevated card gradients
  CARD_ELEVATED: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)",
  CARD_PREMIUM: "linear-gradient(135deg, #FAFAF8 0%, #F7F5F2 100%)",
} as const;

// ============================================
// SUPPORT COLORS
// ============================================
export const SUPPORT_COLORS = {
  SOFT_GRAY: "#F3F4F6",
  CHARCOAL: "#1F2937",
  WARM_GOLD: "#F59E0B",
  SUCCESS_GREEN: "#10B981",
  ERROR_RED: "#EF4444",
  WARNING_AMBER: "#F59E0B",
} as const;

// ============================================
// SHADOW ELEVATIONS (for 3D effect)
// ============================================
export const SHADOWS = {
  SUBTLE: "0 1px 2px rgba(0, 0, 0, 0.05)",
  SOFT: "0 4px 6px rgba(0, 0, 0, 0.07)",
  MEDIUM: "0 10px 15px rgba(0, 0, 0, 0.1)",
  ELEVATED: "0 20px 25px rgba(0, 0, 0, 0.15)",
  HOVER: "0 25px 35px rgba(235, 153, 44, 0.15)",
  GLOW_ORANGE: "0 0 20px rgba(235, 153, 44, 0.25)",
} as const;

// ============================================
// TAILWIND CLASS UTILITIES
// ============================================

/** Premium card base - elevated white/light background */
export const PREMIUM_CARD_BASE = "rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 bg-white";

/** Premium card with gradient background */
export const PREMIUM_CARD_GRADIENT = "rounded-2xl border border-gray-200/30 shadow-sm hover:shadow-md transition-all duration-300";

/** Icon container - dimensional with elevation */
export const ICON_CONTAINER_PREMIUM = "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-3 shadow-sm group-hover:shadow-md transition-all duration-300";

/** Icon container - secondary (darker) */
export const ICON_CONTAINER_DARK = "inline-flex items-center justify-center rounded-xl bg-gray-900/10 p-3 shadow-sm group-hover:shadow-md transition-all duration-300";

/** CTA Button base - premium with hover effects */
export const CTA_BUTTON_PREMIUM = "inline-flex items-center gap-2 rounded-xl font-semibold px-6 py-3 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700";

/** Badge - premium styled with subtle gradient */
export const BADGE_PREMIUM = "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 text-sm font-medium border border-orange-200/50";

/** Banner/Hero section base */
export const BANNER_PREMIUM = "rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50";

/** Dashboard panel - premium with subtle gradient */
export const DASHBOARD_PANEL = "rounded-2xl border border-gray-200/50 shadow-sm bg-gradient-to-br from-white via-gray-50/50 to-white p-6 hover:shadow-md transition-all duration-300";

/** Elevated card stack effect */
export const CARD_STACK = "relative rounded-2xl border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300";

// ============================================
// COMPOSITE STYLES (Multi-element)
// ============================================

export const PREMIUM_SECTION_CONTAINER = {
  base: "relative w-full bg-white",
  withGradient: "relative w-full bg-gradient-to-br from-white via-gray-50/30 to-white",
} as const;

export const PREMIUM_HERO_SECTION = {
  container: "relative w-full py-20 sm:py-24 lg:py-32",
  gradient: "absolute inset-0 bg-gradient-to-br from-orange-50/30 via-white to-cream-100/20 pointer-events-none",
  content: "relative z-10",
} as const;

// ============================================
// 3D VISUAL STYLES
// ============================================

export const _3D_STYLES = {
  /** Floating effect (hover) */
  floating: "transition-transform duration-300 hover:translate-y-[-4px]",
  
  /** Perspective effect */
  perspective: "perspective-1000",
  
  /** Dimensional card effect */
  dimensional: "rounded-2xl shadow-lg border-t border-white/50 hover:shadow-xl transition-all",
  
  /** Icon rotation on hover */
  iconHoverRotate: "transition-transform duration-300 group-hover:rotate-3",
} as const;

// ============================================
// RESPONSIVE SIZING
// ============================================

export const RESPONSIVE_SIZES = {
  MOBILE_PADDING: "px-4 sm:px-6",
  DESKTOP_PADDING: "px-6 lg:px-8",
  SECTION_GAP: "gap-6 sm:gap-8 lg:gap-12",
  GRID_COLS: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
} as const;

// ============================================
// ANIMATION UTILITIES
// ============================================

export const ANIMATIONS = {
  /** Smooth fade in */
  fadeIn: "animate-in fade-in duration-500",
  
  /** Slide up entrance */
  slideUp: "animate-in slide-in-from-bottom duration-500",
  
  /** Bounce entrance */
  bounce: "animate-bounce",
  
  /** Pulse effect */
  pulse: "animate-pulse",
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get gradient style object from gradient name
 * Usage: style={{ background: getGradientStyle('ORANGE_WARM') }}
 */
export function getGradientStyle(gradientName: keyof typeof PREMIUM_GRADIENTS) {
  return {
    background: PREMIUM_GRADIENTS[gradientName],
  };
}

/**
 * Merge multiple Tailwind class strings intelligently
 */
export function mergeUIClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default {
  BRAND_COLORS,
  PREMIUM_GRADIENTS,
  SUPPORT_COLORS,
  SHADOWS,
  PREMIUM_CARD_BASE,
  PREMIUM_CARD_GRADIENT,
  ICON_CONTAINER_PREMIUM,
  ICON_CONTAINER_DARK,
  CTA_BUTTON_PREMIUM,
  BADGE_PREMIUM,
  BANNER_PREMIUM,
  DASHBOARD_PANEL,
  CARD_STACK,
  PREMIUM_SECTION_CONTAINER,
  PREMIUM_HERO_SECTION,
  _3D_STYLES,
  RESPONSIVE_SIZES,
  ANIMATIONS,
  getGradientStyle,
  mergeUIClasses,
};
