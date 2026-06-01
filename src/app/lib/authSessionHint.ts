/**
 * Lightweight hint that this browser tab has signed in before (sessionStorage).
 * Used to skip POST /api/auth/refresh for first-time anonymous visitors — HttpOnly
 * cookie recovery still runs when localStorage has credentials or this hint is set.
 */

const SESSION_HINT_STORAGE_KEY = "caretip_session_hint";

export function markClientSessionHint(): void {
  try {
    sessionStorage.setItem(SESSION_HINT_STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearClientSessionHint(): void {
  try {
    sessionStorage.removeItem(SESSION_HINT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasClientSessionHint(): boolean {
  try {
    return sessionStorage.getItem(SESSION_HINT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Whether startup should POST /api/auth/refresh (avoid 401 noise for cold anonymous visits). */
export function shouldAttemptBootstrapRefresh(hasStoredSession: boolean): boolean {
  return hasStoredSession || hasClientSessionHint();
}
