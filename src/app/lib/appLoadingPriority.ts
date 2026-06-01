/** Higher number wins when multiple loaders are active. */
export const APP_LOADING_PRIORITY = {
  /** PWA install launch splash (AppLoadingSplashContext). */
  LAUNCH_SPLASH: 1000,
  /** Session bootstrap, login submit, post-auth redirect. */
  AUTH: 100,
  /** Page-critical init (onboarding sync, redirect gates) — still one global overlay. */
  APP_INIT: 90,
  /** ProtectedRoute / platform guard / verification gate. */
  ROUTE_GUARD: 80,
  /** In-page sections — never fullscreen overlay. */
  COMPONENT: 20,
} as const;

export type AppLoadingPriority =
  (typeof APP_LOADING_PRIORITY)[keyof typeof APP_LOADING_PRIORITY];

/** Priorities that may show the single global fullscreen overlay. */
export const GLOBAL_OVERLAY_PRIORITIES = new Set<AppLoadingPriority>([
  APP_LOADING_PRIORITY.AUTH,
  APP_LOADING_PRIORITY.APP_INIT,
  APP_LOADING_PRIORITY.ROUTE_GUARD,
]);
