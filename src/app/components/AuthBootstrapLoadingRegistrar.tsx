import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { hasPendingStoredSessionWithoutUser, isAuthRestorePending } from "../lib/authRestore";
import { isPublicAuthenticationPath } from "../lib/authSession";
import { shouldSuppressSessionBootstrapOverlay } from "../lib/authTransitionIntent";import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
  useReleaseAppBootOverlay,
} from "../context/AppLoadingManager";
import { isPublicShellPath } from "../lib/publicRoutes";
import {
  GLOBAL_LOADER_STUCK_WARN_MS,
  traceAuthLoadingCompleted,
  traceAuthLoadingStarted,
  traceLoaderSnapshot,
  warnLoaderStuck,
} from "../lib/loadingStateDiagnostics";

function shouldBlockGlobalAuthLoader(
  pathname: string,
  authStatus: ReturnType<typeof useAuth>["authStatus"],
  user: ReturnType<typeof useAuth>["user"],
): boolean {
  const restorePending = isAuthRestorePending();
  const initializing = authStatus === "initializing";

  if (initializing && isPublicAuthenticationPath(pathname)) return true;

  if (isPublicShellPath(pathname)) return false;

  return (
    initializing ||
    restorePending ||
    hasPendingStoredSessionWithoutUser(user)
  );
}

/**
 * Registers global auth/session bootstrap with the loading overlay.
 * Intentional logout suppresses bootstrap — logout navigates directly to login.
 */
export function AuthBootstrapLoadingRegistrar({ children }: { children: ReactNode }) {
  const { authStatus, user } = useAuth();
  const { pathname } = useLocation();
  const publicShell = isPublicShellPath(pathname);
  const suppressBootstrap = shouldSuppressSessionBootstrapOverlay();
  const authBootstrapBlocking =
    !suppressBootstrap && shouldBlockGlobalAuthLoader(pathname, authStatus, user);
  const releaseAppBootOverlay = useReleaseAppBootOverlay();

  useAppLoadingRegistration(
    "app-auth-bootstrap",
    APP_LOADING_PRIORITY.AUTH,
    authBootstrapBlocking,
  );

  useEffect(() => {
    if (!publicShell) return;
    releaseAppBootOverlay();
  }, [publicShell, releaseAppBootOverlay, pathname]);

  useEffect(() => {
    if (authBootstrapBlocking) {
      traceAuthLoadingStarted();
      traceLoaderSnapshot("auth-bootstrap-blocking", { pathname, authStatus });
      return;
    }
    traceAuthLoadingCompleted(authStatus);
  }, [authBootstrapBlocking, authStatus, pathname]);

  useEffect(() => {
    if (!authBootstrapBlocking) return;
    const id = window.setTimeout(() => {
      warnLoaderStuck("auth-bootstrap", {
        pathname,
        authStatus,
        authHydrated: authBootstrapBlocking,
      });
      traceLoaderSnapshot("auth-bootstrap-timeout", { pathname, authStatus });
    }, GLOBAL_LOADER_STUCK_WARN_MS);
    return () => window.clearTimeout(id);
  }, [authBootstrapBlocking, authStatus, pathname]);

  return <>{children}</>;
}
