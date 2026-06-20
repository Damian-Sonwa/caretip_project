import { useLayoutEffect, useRef, useState } from "react";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingOverlayActive,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
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

/**
 * One-frame overlay extension while auth/guards are active — never re-opens after dismiss.
 * Releases in useLayoutEffect after the shell commit (avoids overlayVisible circular deadlock).
 */
export function useRegisterPagePaintReady(registrationKey: string, enabled = true): void {
  const overlayVisible = useAppLoadingOverlayActive();
  const latchedOnMountRef = useRef(false);
  const [paintReleased, setPaintReleased] = useState(false);

  if (enabled && overlayVisible && !latchedOnMountRef.current && !paintReleased) {
    latchedOnMountRef.current = true;
  }

  useLayoutEffect(() => {
    if (!enabled || !latchedOnMountRef.current) return;
    setPaintReleased(true);
    traceLoaderFlag("pageReady", false, registrationKey);
  }, [enabled, registrationKey]);

  const holdForPaint = enabled && latchedOnMountRef.current && !paintReleased;

  if (holdForPaint) {
    traceLoaderFlag("pageReady", true, registrationKey);
  }

  useRegisterGlobalAppInit(registrationKey, holdForPaint);
}
