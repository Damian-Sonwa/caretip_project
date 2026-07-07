import { useSyncExternalStore } from "react";
import { scheduleIdleWork } from "./publicRouteDefer";

/** Viewport ≤1023px — matches dashboard `lg` breakpoint. */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

/** Defer non-critical work longer on mobile to protect first paint and scrolling. */
export function scheduleMobileDeferredWork(
  work: () => void,
  opts?: { mobileTimeoutMs?: number; desktopTimeoutMs?: number },
): void {
  const mobile = isMobileViewport();
  scheduleIdleWork(work, mobile ? (opts?.mobileTimeoutMs ?? 4000) : (opts?.desktopTimeoutMs ?? 1500));
}

/** Touch-first devices — lighter motion, fewer layout animations. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}
