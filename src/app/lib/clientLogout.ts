/**
 * Synchronous client-side logout cleanup — must complete before navigation.
 * Server refresh invalidation runs separately via {@link logoutAPIWithTimeout}.
 */

import {
  cancelPendingSessionRefresh,
  clearClientAuthStorage,
  clearLogoutPending,
  markClientSessionRevoked,
} from "./api";
import { getMemoryAccessToken } from "./accessTokenStore";
import { authDebug } from "./authDebugLog";
import { deriveAuthSession, getLoginPathForSessionRole } from "./authSession";
import { bumpSessionEpoch } from "./authSessionEpoch";
import { markSessionBootstrapSettled } from "./authSessionBootstrap";
import { notifyAuthStorageSync } from "./authStorageSync";
import { clearImpersonationAdminBackup } from "./impersonationSessionBackup";
import { clearEmployeeNotifications } from "./employeeNotificationStore";
import { resetAllClientSessionCaches } from "./resetAllClientSessionCaches";
import { commitAuthUser, getAuthUser } from "./authUserStore";

export type ClientLogoutResult = {
  loginPath: string;
  capturedAccessToken: string | null;
  clientCleanupMs: number;
};

/** Clears all local session state immediately; returns token snapshot for background logout POST. */
export function performClientLogoutCleanup(): ClientLogoutResult {
  const started = performance.now();
  const priorUser = getAuthUser();
  const loginPath = priorUser ? getLoginPathForSessionRole(priorUser.role) : "/login";
  const capturedAccessToken = getMemoryAccessToken();

  bumpSessionEpoch();
  clearEmployeeNotifications();
  clearImpersonationAdminBackup();
  markClientSessionRevoked();
  cancelPendingSessionRefresh();
  commitAuthUser(null);
  resetAllClientSessionCaches();
  clearClientAuthStorage({ notifySync: false });
  markSessionBootstrapSettled();
  clearLogoutPending();
  notifyAuthStorageSync();

  const clientCleanupMs = performance.now() - started;
  authDebug("logout_client_cleanup", {
    loginPath,
    clientCleanupMs: Math.round(clientCleanupMs),
    priorRole: priorUser?.role ?? null,
    session: deriveAuthSession(null),
  });

  return { loginPath, capturedAccessToken, clientCleanupMs };
}
