import { clearLogoutPending } from "./api";
import { authDebug } from "./authDebugLog";

/** Brief window after logout cleanup — suppress session bootstrap on the login route. */
const POST_LOGOUT_BOOTSTRAP_SUPPRESS_MS = 600;

let active = false;
let bootstrapSuppressUntil = 0;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeAuthLogoutTransition(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isAuthLogoutTransitionActive(): boolean {
  return active;
}

export function isPostLogoutBootstrapSuppress(): boolean {
  return Date.now() < bootstrapSuppressUntil;
}

/** Mark intentional logout before navigation — no overlay, bootstrap suppression only. */
export function beginAuthLogoutTransition(): void {
  if (active) return;
  active = true;
  bootstrapSuppressUntil = Date.now() + 60_000;
  authDebug("logout_transition_start");
  emit();
}

/** Finish logout immediately after client cleanup — keeps bootstrap suppress window. */
export function endAuthLogoutTransition(): void {
  if (!active) return;
  active = false;
  bootstrapSuppressUntil = Date.now() + POST_LOGOUT_BOOTSTRAP_SUPPRESS_MS;
  clearLogoutPending();
  authDebug("logout_transition_end");
  emit();
  window.setTimeout(() => {
    if (Date.now() >= bootstrapSuppressUntil) {
      emit();
    }
  }, POST_LOGOUT_BOOTSTRAP_SUPPRESS_MS + 16);
}
