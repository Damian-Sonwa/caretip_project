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
let bootstrapPromise: Promise<SessionBootstrapResult> | null = null;

export type BootstrapResultHandler = (result: SessionBootstrapResult) => void;

let bootstrapResultHandler: BootstrapResultHandler | null = null;

/** Single handler — first registration wins; avoids N parallel bootstrap consumers. */
export function registerBootstrapResultHandler(handler: BootstrapResultHandler): () => void {
  if (bootstrapResultHandler) return () => {};
  bootstrapResultHandler = handler;
  return () => {
    if (bootstrapResultHandler === handler) bootstrapResultHandler = null;
  };
}

function notify() {
  listeners.forEach((l) => l());
}

export function getAuthSessionFlags(): { authHydrated: boolean; sessionValidated: boolean } {
  return { authHydrated, sessionValidated };
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
  authHydrated = false;
  sessionValidated = false;
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
      authHydrated = true;
      notify();
      bootstrapResultHandler?.(result);
      return result;
    });
  }
  return bootstrapPromise;
}
