import { isAiAssistantEnabled } from "./featureFlags";

/** Intent scoring for the landing onboarding assistant — session-only, no persistence. */

export type LandingIntentEvent =
  | "pricing_click"
  | "faq_interaction"
  | "time_45s"
  | "signup_click"
  | "cta_click"
  | "scroll_depth"
  | "onboarding_attempt";

const SCORES: Record<LandingIntentEvent, number> = {
  pricing_click: 2,
  faq_interaction: 1,
  time_45s: 1,
  signup_click: 2,
  cta_click: 1,
  scroll_depth: 1,
  onboarding_attempt: 2,
};

/** One strong CTA (signup/pricing/onboarding = 2) reveals the launcher. */
export const LANDING_INTENT_THRESHOLD = 2;
/** Auto-open panel after stacked intent (e.g. signup + pricing). */
export const LANDING_INTENT_AUTO_OPEN = 4;

const UNLOCK_STORAGE_KEY = "caretip_landing_ai_unlocked";

const fired = new Set<LandingIntentEvent>();
let score = 0;
const listeners = new Set<(s: number) => void>();

export function getLandingIntentScore(): number {
  return score;
}

export function isLandingAiUnlocked(): boolean {
  if (!isAiAssistantEnabled()) return false;
  if (typeof sessionStorage === "undefined") return score >= LANDING_INTENT_THRESHOLD;
  return sessionStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
}

function persistUnlock(): void {
  if (score >= LANDING_INTENT_THRESHOLD && typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(UNLOCK_STORAGE_KEY, "1");
  }
}

export function subscribeLandingIntent(listener: (score: number) => void): () => void {
  listeners.add(listener);
  listener(score);
  return () => listeners.delete(listener);
}

export function recordLandingIntent(event: LandingIntentEvent): void {
  if (!isAiAssistantEnabled()) return;
  if (fired.has(event)) return;
  fired.add(event);
  score += SCORES[event] ?? 0;
  persistUnlock();
  listeners.forEach((l) => l(score));
}

export function resetLandingIntentForTests(): void {
  fired.clear();
  score = 0;
  listeners.forEach((l) => l(score));
}

export const LANDING_INTENT_EVENT_NAME = "caretip:landing-intent";

export function dispatchLandingIntent(event: LandingIntentEvent): void {
  if (!isAiAssistantEnabled()) return;
  recordLandingIntent(event);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LANDING_INTENT_EVENT_NAME, { detail: { event } }));
  }
}
