import { useEffect } from "react";
import { toast } from "sonner";
import {
  clearClientAuthStorage,
  clearClientSessionRevoked,
  isClientSessionRevoked,
  markClientSessionRevoked,
  refreshSessionAPI,
} from "../lib/api";
import { ensureAuthSessionBootstrap } from "../lib/authBootstrap";
import {
  getAuthSessionFlags,
  markOnboardingStatusFromServer,
  markSessionBootstrapSettled,
} from "../lib/authSessionBootstrap";
import { bumpSessionEpoch, getSessionEpoch } from "../lib/authSessionEpoch";
import { setAuthUser } from "../lib/authUserStore";
import { authDebug } from "../lib/authDebugLog";
import { logClientError } from "../lib/clientLog";
import {
  API_WAKEUP_NETWORK_MESSAGE,
  fallbackMessageForHttpStatus,
  SERVICE_UNAVAILABLE_CLIENT_MESSAGE,
} from "../lib/errorMessages";
import type { SessionBootstrapResult } from "../lib/authSessionBootstrap";
import type { AuthResponse } from "../lib/api";
import { parseUser, type User } from "./useAuth";
import { normalizeStoredUser } from "../lib/authUserNormalize";

const ACCESS_TOKEN_STORAGE_KEY = "caretip_token";
const USER_STORAGE_KEY = "caretip_user";

function readStoredAccessToken(): string | null {
  try {
    const t = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    return t?.trim() ? t.trim() : null;
  } catch {
    return null;
  }
}

function loadUserFromStorage(): User | null {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (!saved) return null;
    return normalizeStoredUser(JSON.parse(saved) as unknown);
  } catch (err) {
    logClientError("useAuthInitializer.localStorage", err);
    return null;
  }
}

function clearStoredSession() {
  clearClientAuthStorage();
}

function persistAuthResponse(data: AuthResponse): User {
  clearClientSessionRevoked();
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.token);
  const u = parseUser(data.user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
  markOnboardingStatusFromServer();
  return u;
}

function isTransientRefreshErrorMessage(msg: string): boolean {
  return (
    msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE ||
    msg === API_WAKEUP_NETWORK_MESSAGE ||
    msg === fallbackMessageForHttpStatus(500) ||
    msg === fallbackMessageForHttpStatus(502) ||
    msg === fallbackMessageForHttpStatus(503) ||
    msg === fallbackMessageForHttpStatus(504) ||
    msg === fallbackMessageForHttpStatus(429)
  );
}

/** Apply bootstrap off the React commit phase — use setAuthUser, not flushSync commitAuthUser. */
function applyBootstrapResult(result: SessionBootstrapResult, epochAtStart: number): void {
  if (getSessionEpoch() !== epochAtStart) {
    markSessionBootstrapSettled();
    return;
  }

  if (result.kind === "authenticated") {
    setAuthUser(persistAuthResponse(result.data));
    markOnboardingStatusFromServer();
    markSessionBootstrapSettled();
    return;
  }

  if (result.kind === "unauthenticated") {
    setAuthUser(null);
    markSessionBootstrapSettled();
    return;
  }

  const stored = loadUserFromStorage();
  setAuthUser(stored);
  // Do not mark sessionValidated — protected APIs stay gated until refresh succeeds.
}

/**
 * Runs once at app root — restores session from storage + POST /api/auth/refresh before route guards redirect.
 */
const TRANSIENT_BOOTSTRAP_RETRY_MS = 4_000;

export function useAuthInitializer(): void {
  useEffect(() => {
    let transientRetryTimer: ReturnType<typeof setTimeout> | null = null;

    ensureAuthSessionBootstrap(
      async () => {
        if (isClientSessionRevoked()) {
          clearStoredSession();
          return { kind: "unauthenticated" };
        }

        const hadLocalSession =
          Boolean(readStoredAccessToken()) || Boolean(loadUserFromStorage());

        if (hadLocalSession) {
          const cached = loadUserFromStorage();
          if (cached) setAuthUser(cached);
        }

        try {
          const data = await refreshSessionAPI();
          return { kind: "authenticated", data };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          const networkFailure =
            err instanceof TypeError &&
            /failed to fetch|networkerror|load failed/i.test(msg);

          if (networkFailure && hadLocalSession) {
            logClientError("useAuthInitializer.sessionBootstrap.network", err);
            return { kind: "transient_error" };
          }

          if (isTransientRefreshErrorMessage(msg) && hadLocalSession) {
            if (msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE) {
              toast.error(SERVICE_UNAVAILABLE_CLIENT_MESSAGE, { id: "caretip-auth-refresh-503" });
            } else if (msg === fallbackMessageForHttpStatus(500)) {
              toast.error(msg, { id: "caretip-auth-refresh-500" });
            }
            logClientError("useAuthInitializer.sessionBootstrap.transient", err);
            return { kind: "transient_error" };
          }

          if (!isTransientRefreshErrorMessage(msg)) {
            const expired =
              hadLocalSession &&
              (msg.includes("sign in") || msg.includes("session has expired"));
            if (expired) {
              authDebug("session_bootstrap", { outcome: "expired_local_session", msg });
            } else {
              logClientError("useAuthInitializer.sessionBootstrap", err);
            }
          }

          if (hadLocalSession) {
            clearStoredSession();
            markClientSessionRevoked();
          }
          return { kind: "unauthenticated" };
        }
      },
      (result, epochAtStart) => {
        applyBootstrapResult(result, epochAtStart);
        if (result.kind === "transient_error") {
          transientRetryTimer = window.setTimeout(() => {
            transientRetryTimer = null;
            if (getSessionEpoch() !== epochAtStart) return;
            const { sessionValidated } = getAuthSessionFlags();
            if (sessionValidated) return;
            void refreshSessionAPI()
              .then((data) => {
                if (getSessionEpoch() !== epochAtStart) return;
                setAuthUser(persistAuthResponse(data));
                markOnboardingStatusFromServer();
                markSessionBootstrapSettled();
              })
              .catch(() => {
                /* remain gated; user can reload or sign in again */
              });
          }, TRANSIENT_BOOTSTRAP_RETRY_MS);
        }
      },
    );

    return () => {
      if (transientRetryTimer != null) window.clearTimeout(transientRetryTimer);
    };
  }, []);
}
