/**
 * CareTip wordmark sizing — width-based tokens (full logo with tagline).
 * Asset: 640×240 (8:3). Never stretch; always object-contain.
 */
export const CARETIP_LOGO_WIDTH_PX = {
  /** Primary marketing nav — mobile */
  navMobile: 96,
  /** Primary marketing nav — desktop */
  navDesktop: 128,
  /** Dashboard desktop sidebar */
  sidebar: 120,
  /** Dashboard mobile drawer / compact header bar */
  drawer: 96,
  /** Auth cards — logo mark (not container) */
  authMobile: 62,
  authDesktop: 80,
  /** Auth logo capsule / surface container */
  authContainerMobile: 88,
  authContainerDesktop: 108,
  /** Customer QR / tip / feedback / success journey */
  customer: 90,
  /** Footer “powered by” and platform badges */
  badge: 60,
  badgeMax: 64,
} as const;

/** Intrinsic wordmark aspect ratio (width ÷ height). */
export const CARETIP_LOGO_ASPECT = 640 / 240;

export function caretipLogoHeightPx(widthPx: number): number {
  return Math.round(widthPx / CARETIP_LOGO_ASPECT);
}

/** Tailwind width classes per context — `h-auto` preserves aspect ratio. */
export const CARETIP_LOGO_SIZE_CLASS = {
  small: "w-[60px] max-w-[64px] h-auto",
  medium: "w-[100px] h-auto max-w-full",
  large: "w-[128px] h-auto max-w-full",
  nav: "w-[96px] lg:w-[128px] h-auto max-w-full",
  sidebar: "w-[120px] h-auto max-w-full",
  drawer: "w-[96px] h-auto max-w-full",
  /** Form-supporting wordmark — smaller on mobile so the card stays primary */
  auth: "w-[62px] max-w-[70px] md:w-[80px] md:max-w-[90px] h-auto",
  customer: "w-[90px] h-auto max-w-full",
  badge: "w-[60px] max-w-[64px] h-auto",
} as const;

export type CareTipLogoSizeToken = keyof typeof CARETIP_LOGO_SIZE_CLASS;

/** @deprecated Prefer semantic tokens (`nav`, `sidebar`, …). */
export const CARETIP_LOGO_LEGACY_SIZE_MAP: Record<string, CareTipLogoSizeToken> = {
  xs: "badge",
  sm: "sidebar",
  md: "sidebar",
  lg: "large",
  hero: "large",
  header: "nav",
  bar: "drawer",
  customerHeader: "customer",
  customerFooter: "badge",
};

export function resolveCareTipLogoSizeToken(size: string): CareTipLogoSizeToken {
  if (size in CARETIP_LOGO_SIZE_CLASS) {
    return size as CareTipLogoSizeToken;
  }
  return CARETIP_LOGO_LEGACY_SIZE_MAP[size] ?? "sidebar";
}

export const DASHBOARD_HEADER_LOGO_CLASS = CARETIP_LOGO_SIZE_CLASS.drawer;
export const DASHBOARD_DRAWER_LOGO_CLASS = CARETIP_LOGO_SIZE_CLASS.drawer;
export const CUSTOMER_JOURNEY_HEADER_LOGO_CLASS = CARETIP_LOGO_SIZE_CLASS.customer;
