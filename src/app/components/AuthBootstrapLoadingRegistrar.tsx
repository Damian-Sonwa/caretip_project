import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { isAuthRestorePending } from "../lib/authRestore";
import {
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
): boolean {
  if (isPublicShellPath(pathname)) return false;

  const restorePending = isAuthRestorePending();
  const initializing = authStatus === "initializing";
  return initializing || restorePending;
}

/**
 * Registers global auth/session bootstrap with the loading overlay.
 * Public marketing and auth shell routes render immediately — no bootstrap overlay.
 */
export function AuthBootstrapLoadingRegistrar({ children }: { children: ReactNode }) {
  const { authStatus } = useAuth();
  const { pathname } = useLocation();
  const publicShell = isPublicShellPath(pathname);
  const authBootstrapBlocking = shouldBlockGlobalAuthLoader(pathname, authStatus);
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
