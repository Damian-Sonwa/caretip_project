import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useSyncExternalStore } from "react";
import { useAuthPostLoginTransitionOverlay } from "../lib/useAuthPostLoginTransitionOverlay";
import {
  endAuthPostLoginTransition,
  getAuthPostLoginTargetPath,
  getPostLoginTransitionMaxMs,
  isAuthPostLoginTransitionActive,
  signalPostLoginDashboardShellReady,
  subscribeAuthPostLoginTransition,
} from "../lib/authPostLoginTransition";

/** Dashboard layouts call {@link signalPostLoginDashboardShellReady} — not pathname alone. */
const DASHBOARD_SHELL_POST_LOGIN_PATHS = new Set([
  "/employee/dashboard",
  "/dashboard",
  "/platform-admin/dashboard",
]);

/**
 * Owns the post-login overlay for the full login → dashboard handoff.
 * Survives login-page unmount so the overlay does not blink during navigation.
 */
export function AuthPostLoginTransitionRegistrar({ children }: { children: ReactNode }) {
  const active = useSyncExternalStore(
    subscribeAuthPostLoginTransition,
    isAuthPostLoginTransitionActive,
    () => false,
  );
  const { pathname } = useLocation();
  const targetPath = getAuthPostLoginTargetPath();

  useAuthPostLoginTransitionOverlay(active);

  /** Fallback for post-auth pages without a dashboard layout (onboarding, verify-email). */
  useLayoutEffect(() => {
    if (!active || !targetPath) return;
    const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
    if (path !== targetPath) return;
    if (DASHBOARD_SHELL_POST_LOGIN_PATHS.has(path)) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) signalPostLoginDashboardShellReady();
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [active, pathname, targetPath]);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      if (isAuthPostLoginTransitionActive()) {
        endAuthPostLoginTransition();
      }
    }, getPostLoginTransitionMaxMs());
    return () => window.clearTimeout(id);
  }, [active]);

  return <>{children}</>;
}
