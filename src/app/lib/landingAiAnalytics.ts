import { resolveApiBaseUrl } from "./apiOrigin";
import { isAiAssistantEnabled } from "./featureFlags";

function landingAiPath(suffix: string): string {
  const base = resolveApiBaseUrl();
  const p = `/api/landing-ai${suffix}`;
  return base ? `${base}${p}` : p;
}

export type LandingAiAnalyticsEvent =
  | "popup_open"
  | "launcher_visible"
  | "prompt_click"
  | "question_asked"
  | "cta_after_ai"
  | "panel_dismiss"
  | "intent_threshold";

const SESSION_KEY = "caretip_landing_ai_sid";

export function getLandingAiSessionId(): string {
  if (typeof sessionStorage === "undefined") return "anon";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `la-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function trackLandingAiEvent(
  event: LandingAiAnalyticsEvent,
  meta?: Record<string, string | number | boolean>,
): void {
  if (!isAiAssistantEnabled()) return;

  const sessionId = getLandingAiSessionId();
  const payload = { event, sessionId, meta, at: Date.now() };

  if (import.meta.env.DEV) {
    console.debug("[landing-ai]", payload);
  }

  void fetch(landingAiPath("/events"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    keepalive: true,
    body: JSON.stringify({ event, sessionId, meta }),
  }).catch(() => {
    /* non-blocking */
  });
}
