/**
 * Single client-side session bootstrap per app load (until logout reset).
 * Prevents duplicate refresh calls and handler loss when `useAuth` instances unmount.
 */

import { getSessionEpoch } from "./authSessionEpoch";
import {
  registerBootstrapResultHandler,
  resetSessionBootstrap,
  runSessionBootstrapOnce,
  type SessionBootstrapResult,
} from "./authSessionBootstrap";

export type BootstrapApplyFn = (result: SessionBootstrapResult, epochAtStart: number) => void;

let bootstrapStarted = false;

/** Reset bootstrap so the next mount can restore session (after logout). */
export function resetAuthSessionClient(): void {
  bootstrapStarted = false;
  resetSessionBootstrap();
}

/**
 * Runs refresh/bootstrap once and applies the result via `applyResult`.
 * Safe to call from every `useAuth()` instance — only the first call runs the network work.
 */
export function ensureAuthSessionBootstrap(
  run: () => Promise<SessionBootstrapResult>,
  applyResult: BootstrapApplyFn,
): void {
  if (bootstrapStarted) return;
  bootstrapStarted = true;

  const epochAtStart = getSessionEpoch();
  registerBootstrapResultHandler((result) => {
    applyResult(result, epochAtStart);
  });

  void runSessionBootstrapOnce(run);
}
