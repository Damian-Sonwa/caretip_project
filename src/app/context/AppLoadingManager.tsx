import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppBrandedLoadingScreen } from "../components/AppBrandedLoadingScreen";
import {
  APP_LOADING_PRIORITY,
  GLOBAL_OVERLAY_PRIORITIES,
  type AppLoadingPriority,
} from "../lib/appLoadingPriority";
import {
  traceGlobalLoaderBlocking,
  traceGlobalLoaderReady,
  traceGlobalOverlayDismissed,
} from "../lib/globalAppLoadingTrace";
import { dismissHtmlMarketingBootBridge } from "../lib/htmlMarketingBootBridge";
import { isPublicMarketingPath, isPublicShellPath } from "../lib/publicRoutes";
import { traceLoaderRegistration, warnLoaderDiagDeadlock } from "../lib/loaderDiagFlags";

const OVERLAY_FADE_MS = 180;
/** Absorb one-frame registration gaps between auth, route guard, and layout paint. */
const OVERLAY_EXIT_DEBOUNCE_MS = 120;
/** Avoid sub-frame loader flashes — intentional minimum visible time. */
const MIN_OVERLAY_VISIBLE_MS = 280;
/** Block APP_INIT from re-opening the overlay shortly after a full dismiss (paint-ready race). */
const OVERLAY_REENTRY_LOCK_MS = 600;

/** Same-priority overlay winner — higher wins. */
const OVERLAY_KEY_PRECEDENCE: Record<string, number> = {
  "auth-post-login-transition": 30,
  "app-auth-bootstrap": 20,
  "app-boot": 10,
};

function overlayKeyPrecedence(key: string): number {
  if (OVERLAY_KEY_PRECEDENCE[key] != null) return OVERLAY_KEY_PRECEDENCE[key]!;
  if (key.startsWith("protected-route-guard")) return 15;
  return 0;
}

type Registration = {
  key: string;
  priority: AppLoadingPriority;
  message?: string;
};

type AppLoadingManagerContextValue = {
  register: (
    key: string,
    priority: AppLoadingPriority,
    active: boolean,
    message?: string,
  ) => void;
  releaseAppBootOverlay: () => void;
  overlayVisible: boolean;
};

const AppLoadingManagerContext = createContext<AppLoadingManagerContextValue | null>(null);

const LaunchSplashContext = createContext(false);

export function LaunchSplashVisibilityProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <LaunchSplashContext.Provider value={active}>{children}</LaunchSplashContext.Provider>
  );
}

function useLaunchSplashActive(): boolean {
  return useContext(LaunchSplashContext);
}

export function useAppLoadingRegistration(
  key: string,
  priority: AppLoadingPriority,
  active: boolean,
  message?: string,
): void {
  const ctx = useContext(AppLoadingManagerContext);
  const register = ctx?.register;

  useLayoutEffect(() => {
    if (!register) return;
    register(key, priority, active, message);
    return () => {
      register(key, priority, false);
    };
  }, [register, key, priority, active, message]);
}

/** Drop the initial app-boot registration (public routes render without the bootstrap overlay). */
export function useReleaseAppBootOverlay(): () => void {
  const ctx = useContext(AppLoadingManagerContext);
  return ctx?.releaseAppBootOverlay ?? (() => undefined);
}

type OverlayPhase = "hidden" | "visible" | "exiting";

const BOOTSTRAP_KEY = "app-boot";
/** Safety net — never leave the initial bootstrap key as the only active overlay. */
const BOOTSTRAP_OVERLAY_MAX_MS = 15_000;

function readInitialPathname(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname.split("?")[0]?.split("#")[0] ?? "/";
}

/**
 * Initial bootstrap overlay for cold loads.
 * Marketing routes always show the branded loader (no session / visit gating).
 * Auth forms stay immediate; protected apps keep the existing boot overlay.
 */
function shouldRegisterInitialAppBoot(pathname: string): boolean {
  if (isPublicMarketingPath(pathname)) return true;
  if (isPublicShellPath(pathname)) return false;
  return true;
}

function createInitialRegistrations(): Map<string, Registration> {
  const initial = new Map<string, Registration>();
  if (!shouldRegisterInitialAppBoot(readInitialPathname())) {
    return initial;
  }
  initial.set(BOOTSTRAP_KEY, { key: BOOTSTRAP_KEY, priority: APP_LOADING_PRIORITY.AUTH });
  return initial;
}

function createInitialOverlayPhase(): OverlayPhase {
  if (!shouldRegisterInitialAppBoot(readInitialPathname())) return "hidden";
  return "visible";
}

export function AppLoadingManagerProvider({ children }: { children: React.ReactNode }) {
  const launchSplashActive = useLaunchSplashActive();
  const [registrations, setRegistrations] = useState<Map<string, Registration>>(createInitialRegistrations);
  const [overlayPhase, setOverlayPhase] = useState<OverlayPhase>(createInitialOverlayPhase);
  const lastWinnerKeyRef = useRef<string | null>(null);
  const showOverlayRef = useRef(false);
  const exitDebounceRef = useRef<number | null>(null);
  const overlayDismissedAtRef = useRef(0);
  const overlayShownAtRef = useRef(0);
  const minVisibleTimerRef = useRef<number | null>(null);

  const register = useCallback(
    (key: string, priority: AppLoadingPriority, active: boolean, message?: string) => {
      if (!GLOBAL_OVERLAY_PRIORITIES.has(priority) && active) {
        if (import.meta.env.DEV) {
          console.warn(
            `[GlobalAppLoading] "${key}" uses priority ${priority} — not a global overlay priority`,
          );
        }
      }

      if (active) {
        setRegistrations((prev) => {
          if (
            priority === APP_LOADING_PRIORITY.APP_INIT &&
            !prev.has(BOOTSTRAP_KEY) &&
            ![...prev.values()].some(
              (r) =>
                r.priority === APP_LOADING_PRIORITY.AUTH ||
                r.priority === APP_LOADING_PRIORITY.ROUTE_GUARD,
            ) &&
            overlayDismissedAtRef.current > 0 &&
            Date.now() - overlayDismissedAtRef.current < OVERLAY_REENTRY_LOCK_MS
          ) {
            if (import.meta.env.DEV) {
              console.info(
                `[GlobalAppLoading] Suppressed APP_INIT re-entry for "${key}" (post-dismiss lock)`,
              );
            }
            return prev;
          }
          if (prev.has(key)) {
            const existing = prev.get(key)!;
            if (existing.priority === priority && existing.message === message) {
              return prev;
            }
          }
          if (import.meta.env.DEV && GLOBAL_OVERLAY_PRIORITIES.has(priority)) {
            traceGlobalLoaderBlocking(key, priority);
            traceLoaderRegistration(key, true, priority);
          }
          const next = new Map(prev);
          next.set(key, { key, priority, message });
          if (key !== BOOTSTRAP_KEY && next.has(BOOTSTRAP_KEY)) {
            next.delete(BOOTSTRAP_KEY);
          }
          return next;
        });
        return;
      }

      setRegistrations((prev) => {
        if (!prev.has(key)) return prev;
        if (import.meta.env.DEV && GLOBAL_OVERLAY_PRIORITIES.has(priority)) {
          traceGlobalLoaderReady(key);
          traceLoaderRegistration(key, false, priority);
        }
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    },
    [],
  );

  const releaseAppBootOverlay = useCallback(() => {
    setRegistrations((prev) => {
      if (!prev.has(BOOTSTRAP_KEY)) return prev;
      const next = new Map(prev);
      next.delete(BOOTSTRAP_KEY);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setRegistrations((prev) => {
        if (prev.size === 1 && prev.has(BOOTSTRAP_KEY)) {
          if (import.meta.env.DEV) {
            console.warn(
              "[GlobalAppLoading] app-boot timed out — no loader registered; forcing dismiss",
            );
          }
          return new Map();
        }
        return prev;
      });
    }, BOOTSTRAP_OVERLAY_MAX_MS);
    return () => window.clearTimeout(id);
  }, []);

  const winner = useMemo(() => {
    let best: Registration | null = null;
    const hasNonBootstrap = registrations.size > 1 || !registrations.has(BOOTSTRAP_KEY);
    for (const reg of registrations.values()) {
      if (reg.key === BOOTSTRAP_KEY && hasNonBootstrap) continue;
      if (!GLOBAL_OVERLAY_PRIORITIES.has(reg.priority)) continue;
      if (
        !best ||
        reg.priority > best.priority ||
        (reg.priority === best.priority &&
          overlayKeyPrecedence(reg.key) > overlayKeyPrecedence(best.key))
      ) {
        best = reg;
      }
    }
    return best;
  }, [registrations]);

  const showOverlay = Boolean(winner) && !launchSplashActive;
  const overlayMessage = winner?.message;
  showOverlayRef.current = showOverlay;

  useEffect(() => {
    if (showOverlay) {
      if (exitDebounceRef.current !== null) {
        window.clearTimeout(exitDebounceRef.current);
        exitDebounceRef.current = null;
      }
      if (minVisibleTimerRef.current !== null) {
        window.clearTimeout(minVisibleTimerRef.current);
        minVisibleTimerRef.current = null;
      }
      if (overlayPhase !== "visible") {
        overlayShownAtRef.current = Date.now();
      }
      setOverlayPhase("visible");
      const key = winner?.key ?? null;
      if (import.meta.env.DEV && key && key !== lastWinnerKeyRef.current) {
        console.info(`[GlobalAppLoading] Overlay active — ${key}`);
      }
      lastWinnerKeyRef.current = key;
      return;
    }

    if (overlayPhase === "hidden") return;

    const scheduleExit = (): void => {
      const elapsed = Date.now() - overlayShownAtRef.current;
      const delayExit = Math.max(0, MIN_OVERLAY_VISIBLE_MS - elapsed);

      const startExit = (): void => {
        if (showOverlayRef.current) return;
        overlayDismissedAtRef.current = Date.now();
        setOverlayPhase("exiting");
        traceGlobalOverlayDismissed();
      };

      if (delayExit === 0) {
        startExit();
        return;
      }
      minVisibleTimerRef.current = window.setTimeout(() => {
        minVisibleTimerRef.current = null;
        startExit();
      }, delayExit);
    };

    /* Marketing cold loads must keep the existing min-visible fade (no instant hide). */
    if (exitDebounceRef.current !== null) {
      window.clearTimeout(exitDebounceRef.current);
    }
    exitDebounceRef.current = window.setTimeout(() => {
      exitDebounceRef.current = null;
      if (showOverlayRef.current) return;
      scheduleExit();
    }, OVERLAY_EXIT_DEBOUNCE_MS);

    return () => {
      if (exitDebounceRef.current !== null) {
        window.clearTimeout(exitDebounceRef.current);
        exitDebounceRef.current = null;
      }
      if (minVisibleTimerRef.current !== null) {
        window.clearTimeout(minVisibleTimerRef.current);
        minVisibleTimerRef.current = null;
      }
    };
  }, [showOverlay, winner?.key, overlayPhase]);

  useEffect(() => {
    if (overlayPhase !== "exiting") return;
    const id = window.setTimeout(() => {
      setOverlayPhase("hidden");
      lastWinnerKeyRef.current = null;
    }, OVERLAY_FADE_MS);
    return () => window.clearTimeout(id);
  }, [overlayPhase]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[GlobalAppLoading] state", {
      showOverlay,
      overlayPhase,
      winner: winner?.key ?? null,
      winnerPriority: winner?.priority ?? null,
      activeKeys: [...registrations.keys()],
    });
    if (showOverlay && winner?.key?.includes("paint")) {
      console.info("[LoaderDiag] overlay winner is paint-ready", {
        key: winner.key,
        activeKeys: [...registrations.keys()],
      });
    }
  }, [showOverlay, overlayPhase, winner, registrations]);

  useEffect(() => {
    if (!import.meta.env.DEV || !showOverlay) return;
    const id = window.setTimeout(() => {
      const keys = [...registrations.keys()];
      if (keys.length === 0) return;
      warnLoaderDiagDeadlock(winner?.key ?? null, keys, {
        overlayPhase,
        stuckAfterMs: 10_000,
      });
    }, 10_000);
    return () => window.clearTimeout(id);
  }, [showOverlay, winner?.key, registrations, overlayPhase]);

  const value = useMemo(
    () => ({ register, releaseAppBootOverlay, overlayVisible: showOverlay || overlayPhase === "exiting" }),
    [register, releaseAppBootOverlay, showOverlay, overlayPhase],
  );

  const renderOverlay = overlayPhase === "visible" || overlayPhase === "exiting";

  /* Handoff: React branded overlay owns the screen — drop the HTML first-paint bridge. */
  useLayoutEffect(() => {
    if (!renderOverlay) return;
    dismissHtmlMarketingBootBridge();
  }, [renderOverlay]);

  useEffect(() => {
    const id = window.setTimeout(() => dismissHtmlMarketingBootBridge(), 8_000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <AppLoadingManagerContext.Provider value={value}>
      {children}
      {renderOverlay ? (
        <AppBrandedLoadingScreen
          fixed
          message={overlayMessage}
          exiting={overlayPhase === "exiting"}
        />
      ) : null}
    </AppLoadingManagerContext.Provider>
  );
}

export function useAppLoadingOverlayActive(): boolean {
  const launchSplashActive = useLaunchSplashActive();
  const ctx = useContext(AppLoadingManagerContext);
  return launchSplashActive || (ctx?.overlayVisible ?? false);
}

export { APP_LOADING_PRIORITY };
