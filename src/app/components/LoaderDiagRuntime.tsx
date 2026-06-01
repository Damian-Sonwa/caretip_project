import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { isAuthRestorePending } from "../lib/authRestore";
import { getAuthSessionFlags, subscribeAuthSessionFlags } from "../lib/authSessionBootstrap";
import { useProtectedRouteGate } from "../hooks/useProtectedRouteGate";
import { useAppLoadingOverlayActive } from "../context/AppLoadingManager";
import {
  getLoaderDiagSnapshot,
  logLoaderDiagSnapshot,
  traceLoaderFlag,
  warnLoaderDiagDeadlock,
} from "../lib/loaderDiagFlags";

const STUCK_MS = 8_000;

/**
 * Dev-only runtime probe — logs [LoaderDiag] flag transitions and periodic snapshots.
 * Mount once under AppLoadingManagerProvider.
 */
export function LoaderDiagRuntime() {
  const { authStatus, user } = useAuth();
  const { pathname } = useLocation();
  const overlayVisible = useAppLoadingOverlayActive();
  const gate = useProtectedRouteGate(["business", "employee"]);
  const stuckSinceRef = useRef<number | null>(null);
  const lastWinnerRef = useRef<string | null>(null);

  const authLoading = authStatus === "initializing" || isAuthRestorePending();
  const sessionLoading = !getAuthSessionFlags().sessionValidated;
  const routeLoading = gate.blocking;
  const onboardingLoading = gate.decision?.kind === "wait";

  useEffect(() => {
    traceLoaderFlag("authLoading", authLoading);
  }, [authLoading]);

  useEffect(() => {
    traceLoaderFlag("sessionLoading", sessionLoading);
  }, [sessionLoading]);

  useEffect(() => {
    traceLoaderFlag("routeLoading", routeLoading, pathname);
  }, [routeLoading, pathname]);

  useEffect(() => {
    traceLoaderFlag("onboardingLoading", onboardingLoading);
  }, [onboardingLoading]);

  useEffect(() => {
    traceLoaderFlag("businessLoading", user?.role === "business" && routeLoading);
  }, [user?.role, routeLoading]);

  useEffect(() => {
    traceLoaderFlag("employeeLoading", user?.role === "employee" && routeLoading);
  }, [user?.role, routeLoading]);

  useEffect(() => {
    const unsub = subscribeAuthSessionFlags(() => {
      const { onboardingStatusFromServer } = getAuthSessionFlags();
      traceLoaderFlag("destinationReady", onboardingStatusFromServer);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!overlayVisible) {
      stuckSinceRef.current = null;
      lastWinnerRef.current = null;
      return;
    }
    if (stuckSinceRef.current == null) {
      stuckSinceRef.current = Date.now();
      logLoaderDiagSnapshot("overlay became visible", { pathname });
      return;
    }
    const elapsed = Date.now() - stuckSinceRef.current;
    if (elapsed >= STUCK_MS) {
      const snap = getLoaderDiagSnapshot();
      const winner = (snap.activeRegistrations as string[] | undefined)?.[0] ?? null;
      if (winner === lastWinnerRef.current) {
        warnLoaderDiagDeadlock(winner, snap.activeRegistrations as string[], {
          pathname,
          elapsedMs: elapsed,
          authStatus,
          authLoading,
          sessionLoading,
          routeLoading,
        });
      }
      lastWinnerRef.current = winner;
      stuckSinceRef.current = Date.now();
    }
  }, [overlayVisible, pathname, authStatus, authLoading, sessionLoading, routeLoading]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const id = window.setInterval(() => {
      if (!overlayVisible) return;
      logLoaderDiagSnapshot("periodic (overlay visible)", { pathname });
    }, 5_000);
    return () => window.clearInterval(id);
  }, [overlayVisible, pathname]);

  return null;
}
