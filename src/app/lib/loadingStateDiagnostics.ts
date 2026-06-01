/**
 * Dev-only traces for global loader / auth bootstrap deadlocks.
 */

import { getAuthSessionFlags } from "./authSessionBootstrap";
import { hasClientStoredSession } from "./authUserStore";
import { isClientSessionRevoked } from "./api";
import type { AuthStatus } from "./authSession";

const STARTED = new Set<string>();

function devLog(message: string, detail?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  if (detail) console.info(`[LoaderDiag] ${message}`, detail);
  else console.info(`[LoaderDiag] ${message}`);
}

export function traceAuthLoadingStarted(): void {
  if (STARTED.has("auth")) return;
  STARTED.add("auth");
  devLog("Auth loading started");
}

export function traceAuthLoadingCompleted(authStatus: AuthStatus): void {
  if (!STARTED.has("auth")) return;
  STARTED.delete("auth");
  devLog("Auth loading completed", { authStatus });
}

export function traceSessionValidationStarted(): void {
  if (STARTED.has("session")) return;
  STARTED.add("session");
  devLog("Session validation started");
}

export function traceSessionValidationCompleted(validated: boolean): void {
  if (!STARTED.has("session")) return;
  STARTED.delete("session");
  devLog("Session validation completed", { sessionValidated: validated });
}

export function traceRouteResolutionStarted(pathname: string): void {
  devLog("Route resolution started", { pathname });
}

export function traceRouteResolutionCompleted(pathname: string, blocking: boolean): void {
  devLog("Route resolution completed", { pathname, blocking });
}

export function traceLoaderSnapshot(context: string, extra?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  const { authHydrated, sessionValidated, onboardingStatusFromServer } = getAuthSessionFlags();
  devLog(`Snapshot — ${context}`, {
    authHydrated,
    sessionValidated,
    onboardingStatusFromServer,
    hasStoredSession: hasClientStoredSession(),
    sessionRevoked: isClientSessionRevoked(),
    ...extra,
  });
}

export function warnLoaderStuck(context: string, detail: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  console.warn(`[LoaderDiag] STUCK — ${context}`, detail);
}

/** Max time before we force-dismiss bootstrap overlay and log the blocker. */
export const GLOBAL_LOADER_STUCK_WARN_MS = 12_000;
