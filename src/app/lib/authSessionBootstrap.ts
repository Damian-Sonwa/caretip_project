/**
 * Single-flight session bootstrap shared by every `useAuth()` caller.
 * Without this, each hook instance runs its own hydration flags and can redirect early.
 */

import type { AuthResponse } from "./api";

export type SessionBootstrapResult =
  | { kind: "authenticated"; data: AuthResponse }
  | { kind: "unauthenticated" }
  | { kind: "transient_error" };

type BootstrapRunner = () => Promise<SessionBootstrapResult>;

const listeners = new Set<() => void>();

let authHydrated = false;
let sessionValidated = false;
/** True after login/refresh/bootstrap returned onboarding status from the API (not stale cache). */
let onboardingStatusFromServer = false;
let bootstrapPromise: Promise<SessionBootstrapResult> | null = null;

export type BootstrapResultHandler = (result: SessionBootstrapResult) => void;

let bootstrapResultHandler: BootstrapResultHandler | null = null;

/** Registers the handler that applies bootstrap results to shared auth state. */
export function registerBootstrapResultHandler(handler: BootstrapResultHandler): void {
  bootstrapResultHandler = handler;
}

function notify() {
  listeners.forEach((l) => l());
}

export function getAuthSessionFlags(): {
  authHydrated: boolean;
  sessionValidated: boolean;
  onboardingStatusFromServer: boolean;
} {
  return { authHydrated, sessionValidated, onboardingStatusFromServer };
}

/** Onboarding guards may redirect only after the server confirmed completion status. */
export function markOnboardingStatusFromServer(): void {
  onboardingStatusFromServer = true;
  notify();
}

export function subscribeAuthSessionFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** After explicit login/register — skip re-bootstrap until next full reload/logout. */
export function markSessionBootstrapSettled(): void {
  authHydrated = true;
  sessionValidated = true;
  notify();
}

/** Logout or hard reset — next mount must bootstrap again. */
export function resetSessionBootstrap(): void {
  bootstrapPromise = null;
  bootstrapResultHandler = null;
  authHydrated = false;
  sessionValidated = false;
  onboardingStatusFromServer = false;
  notify();
}

/**
 * Runs session restoration once per page load (or after {@link resetSessionBootstrap}).
 * Sets `authHydrated` + `sessionValidated` when finished.
 */
export function runSessionBootstrapOnce(run: BootstrapRunner): Promise<SessionBootstrapResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        return await run();
      } catch {
        return { kind: "unauthenticated" };
      }
    })().then((result) => {
      bootstrapResultHandler?.(result);
      authHydrated = true;
      notify();
      return result;
    });
  }
  return bootstrapPromise;
}
