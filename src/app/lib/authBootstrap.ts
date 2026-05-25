/**
 * Single client-side session bootstrap per app load (until logout reset).
 * Prevents duplicate refresh calls; always keeps the latest result handler (Strict Mode safe).
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
 * Safe to call from every `useAuth()` / `AuthProvider` mount — only the first call runs the network work;
 * later calls update the handler so the active tree receives the bootstrap result.
 */
export function ensureAuthSessionBootstrap(
  run: () => Promise<SessionBootstrapResult>,
  applyResult: BootstrapApplyFn,
): void {
  const epochAtStart = getSessionEpoch();
  registerBootstrapResultHandler((result) => {
    applyResult(result, epochAtStart);
  });

  if (bootstrapStarted) return;
  bootstrapStarted = true;
  void runSessionBootstrapOnce(run);
}
