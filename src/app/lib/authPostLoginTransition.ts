import { authDebug } from "./authDebugLog";

/** Visual polish only — overlay stays up at least this long after login begins. */
const POST_LOGIN_MIN_VISIBLE_MS = 400;

const POST_LOGIN_MAX_MS = 15_000;

let active = false;
let targetPath: string | null = null;
let startedAt = 0;
let shellReady = false;
let endTimer: number | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function clearEndTimer(): void {
  if (endTimer !== null) {
    window.clearTimeout(endTimer);
    endTimer = null;
  }
}

function maybeScheduleEnd(): void {
  if (!active || !shellReady) return;
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, POST_LOGIN_MIN_VISIBLE_MS - elapsed);
  clearEndTimer();
  endTimer = window.setTimeout(() => {
    endTimer = null;
    endAuthPostLoginTransition();
  }, remaining);
}

export function subscribeAuthPostLoginTransition(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isAuthPostLoginTransitionActive(): boolean {
  return active;
}

export function getAuthPostLoginTargetPath(): string | null {
  return targetPath;
}

/** Begin post-login overlay before navigating away from the login route. */
export function beginAuthPostLoginTransition(target: string): void {
  const normalized = target.split("?")[0]?.split("#")[0] ?? target;
  if (active && targetPath === normalized) return;
  active = true;
  targetPath = normalized;
  shellReady = false;
  startedAt = Date.now();
  clearEndTimer();
  authDebug("post_login_transition_start", { target: normalized });
  emit();
}

/** Dashboard / post-auth shell committed — release overlay after min visible time. */
export function signalPostLoginDashboardShellReady(): void {
  if (!active) return;
  shellReady = true;
  maybeScheduleEnd();
}

export function endAuthPostLoginTransition(): void {
  if (!active) return;
  active = false;
  targetPath = null;
  shellReady = false;
  clearEndTimer();
  authDebug("post_login_transition_end");
  emit();
}

export function getPostLoginTransitionMaxMs(): number {
  return POST_LOGIN_MAX_MS;
}
