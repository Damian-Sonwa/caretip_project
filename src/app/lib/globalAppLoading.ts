import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingOverlayActive,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import {
  isAuthPostLoginTransitionActive,
  signalPostLoginDashboardShellReady,
  subscribeAuthPostLoginTransition,
} from "./authPostLoginTransition";
import {
  isAuthLogoutTransitionActive,
  subscribeAuthLogoutTransition,
} from "./authLogoutTransition";
import { traceLoaderFlag } from "./loaderDiagFlags";
import { globalAppLoadingHoldClassName } from "./globalAppLoadingHoldClassName";

export { APP_LOADING_PRIORITY, useAppLoadingOverlayActive, useAppLoadingRegistration };
export { globalAppLoadingHoldClassName };

/** Single source of truth: is the global fullscreen loader visible? */
export function useGlobalAppLoadingActive(): boolean {
  return useAppLoadingOverlayActive();
}

/**
 * Register page-critical initialization with the global overlay.
 * Never pair with a page-level fullscreen spinner — use {@link GlobalAppLoadingHold} under the overlay.
 */
export function useRegisterGlobalAppInit(
  key: string,
  active: boolean,
  message?: string,
): void {
  useAppLoadingRegistration(key, APP_LOADING_PRIORITY.APP_INIT, active, message);
}

function useUserJourneyOverlayOwnsScreen(): boolean {
  const postLoginActive = useSyncExternalStore(
    subscribeAuthPostLoginTransition,
    isAuthPostLoginTransitionActive,
    () => false,
  );
  const logoutActive = useSyncExternalStore(
    subscribeAuthLogoutTransition,
    isAuthLogoutTransitionActive,
    () => false,
  );
  return postLoginActive || logoutActive;
}

type PagePaintReadyOptions = {
  /** Fires after the one-frame paint latch releases (shell commit). */
  onPaintReleased?: () => void;
};

/**
 * One-frame overlay extension while auth/guards are active — never re-opens after dismiss.
 * Technical paint keys are excluded from overlay winner selection; they must not replace user journeys.
 */
export function useRegisterPagePaintReady(
  registrationKey: string,
  enabled = true,
  options?: PagePaintReadyOptions,
): void {
  const userJourneyOwnsScreen = useUserJourneyOverlayOwnsScreen();
  const overlayVisible = useAppLoadingOverlayActive();
  const latchedOnMountRef = useRef(false);
  const [paintReleased, setPaintReleased] = useState(false);
  const onPaintReleased = options?.onPaintReleased;

  if (enabled && overlayVisible && !latchedOnMountRef.current && !paintReleased) {
    latchedOnMountRef.current = true;
  }

  useLayoutEffect(() => {
    if (!enabled || !latchedOnMountRef.current) return;
    setPaintReleased(true);
    traceLoaderFlag("pageReady", false, registrationKey);
    onPaintReleased?.();
  }, [enabled, registrationKey, onPaintReleased]);

  const holdForPaint =
    enabled &&
    latchedOnMountRef.current &&
    !paintReleased &&
    !userJourneyOwnsScreen;

  if (holdForPaint) {
    traceLoaderFlag("pageReady", true, registrationKey);
  }

  useRegisterGlobalAppInit(registrationKey, holdForPaint);
}

/**
 * Dashboard shell paint latch + post-login handoff signal.
 * Post-login transition ends only after shell paint releases — not on layout mount alone.
 */
export function useDashboardLayoutPaintReady(registrationKey: string, enabled = true): void {
  useRegisterPagePaintReady(registrationKey, enabled, {
    onPaintReleased: signalPostLoginDashboardShellReady,
  });
}
