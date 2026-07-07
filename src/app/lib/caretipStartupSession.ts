/**
 * HTML-first branded splash for public landing entry only (see index.html gate script).
 * React coordinates dismissal when the landing shell is ready — never on dashboard refresh.
 */

const LOADER_ID = "caretip-startup-loader";
const ACTIVE_CLASS = "caretip-startup-active";
const EXIT_CLASS = "caretip-startup-loader--exit";
export const CARETIP_STARTUP_FADE_MS = 300;
const MIN_DISPLAY_MS = 850;
const MAX_DISPLAY_MS = 3_000;

const PUBLIC_LANDING_PATHS = new Set(["/", "/landing"]);

let handoffPending = false;
let reactMounted = false;
let landingShellReady = false;
let minDisplayElapsed = false;
let dismissInFlight = false;

let minTimer: number | null = null;
let maxTimer: number | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeCareTipStartupSplash(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getCareTipStartupLoaderElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(LOADER_ID);
}

export function hasCareTipStartupLoaderMarkup(): boolean {
  return getCareTipStartupLoaderElement() != null;
}

export function isPublicLandingBrandSplashPath(pathname: string): boolean {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  return PUBLIC_LANDING_PATHS.has(path);
}

/** True while the landing brand splash is active (landing entry only). */
export function isCareTipStartupSplashCovering(): boolean {
  if (isStandalonePwa()) return false;
  return handoffPending;
}

export function removeCareTipStartupLoaderImmediately(): void {
  handoffPending = false;
  dismissInFlight = false;
  clearStartupTimers();
  document.documentElement.classList.remove(ACTIVE_CLASS);
  getCareTipStartupLoaderElement()?.remove();
  emit();
}

function clearStartupTimers(): void {
  if (minTimer !== null) {
    window.clearTimeout(minTimer);
    minTimer = null;
  }
  if (maxTimer !== null) {
    window.clearTimeout(maxTimer);
    maxTimer = null;
  }
}

function completeStartupHandoff(): void {
  handoffPending = false;
  dismissInFlight = false;
  emit();
}

function performStartupFadeOut(): void {
  if (!handoffPending && !hasCareTipStartupLoaderMarkup()) return;
  if (isStandalonePwa()) {
    removeCareTipStartupLoaderImmediately();
    return;
  }

  const el = getCareTipStartupLoaderElement();
  if (!el) {
    completeStartupHandoff();
    document.documentElement.classList.remove(ACTIVE_CLASS);
    return;
  }

  dismissInFlight = true;
  clearStartupTimers();
  emit();

  requestAnimationFrame(() => {
    el.classList.add(EXIT_CLASS);
    el.setAttribute("aria-busy", "false");
    window.setTimeout(() => {
      el.remove();
      document.documentElement.classList.remove(ACTIVE_CLASS);
      completeStartupHandoff();
    }, CARETIP_STARTUP_FADE_MS);
  });
}

function isStartupReady(): boolean {
  return reactMounted && landingShellReady && minDisplayElapsed;
}

function tryDismissStartupLoader(): void {
  if (!handoffPending || dismissInFlight) return;
  if (!hasCareTipStartupLoaderMarkup()) {
    completeStartupHandoff();
    return;
  }
  if (!isStartupReady()) return;
  performStartupFadeOut();
}

export function markCareTipStartupReactMounted(): void {
  if (isStandalonePwa() || !hasCareTipStartupLoaderMarkup()) return;
  reactMounted = true;
  emit();
  tryDismissStartupLoader();
}

/** Landing page shell committed — not below-fold data or images. */
export function markCareTipStartupLandingReady(): void {
  if (isStandalonePwa() || !hasCareTipStartupLoaderMarkup()) return;
  landingShellReady = true;
  emit();
  tryDismissStartupLoader();
}

export function initCareTipStartupOrchestrator(): void {
  if (isStandalonePwa() || !hasCareTipStartupLoaderMarkup()) return;
  if (minTimer !== null || maxTimer !== null) return;

  handoffPending = true;
  emit();

  minTimer = window.setTimeout(() => {
    minDisplayElapsed = true;
    minTimer = null;
    tryDismissStartupLoader();
  }, MIN_DISPLAY_MS);

  maxTimer = window.setTimeout(() => {
    maxTimer = null;
    performStartupFadeOut();
  }, MAX_DISPLAY_MS);
}
