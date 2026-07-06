import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { CareTipLoadingOverlay } from "../components/CareTipLoadingOverlay";
import { CARETIP_LOADER_FADE_MS } from "../lib/appLoaderTransition";
import { LaunchSplashVisibilityProvider } from "./AppLoadingManager";

/**
 * Launch splash: first paint through app shell ready (all surfaces).
 * PWA keeps a short minimum visible time so the mark does not flash.
 */
const MIN_VISIBLE_MS_PWA = 420;
/** If layout never signals (e.g. unusual error routes), still dismiss splash. */
const SHELL_READY_FALLBACK_MS = 8000;

type Phase = "on" | "exit" | "off";

type AppLoadingSplashContextValue = {
  markAppShellReady: () => void;
  setRouteTransitionPending: (pending: boolean) => void;
  /** App shell may fade in route content — false while launch overlay is up or exiting. */
  revealed: boolean;
};

const AppLoadingSplashContext = createContext<AppLoadingSplashContextValue | null>(null);

export function useAppLoadingCoordinator() {
  const ctx = useContext(AppLoadingSplashContext);
  if (!ctx) {
    throw new Error("useAppLoadingCoordinator must be used within AppLoadingSplashProvider");
  }
  return ctx;
}

export function useMarkAppShellReady() {
  return useAppLoadingCoordinator().markAppShellReady;
}

export function useMarkAppShellReadyOptional() {
  return useContext(AppLoadingSplashContext)?.markAppShellReady;
}

export function useAppRevealState(): { revealed: boolean } {
  const ctx = useContext(AppLoadingSplashContext);
  return { revealed: ctx?.revealed ?? true };
}

export function AppLoadingSplashProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isStandalone = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }, []);

  const [phase, setPhase] = useState<Phase>("on");
  const [minElapsed, setMinElapsed] = useState(!isStandalone);
  const [shellReady, setShellReady] = useState(false);
  const [seamlessHandoff] = useState(
    () => typeof window !== "undefined" && window.__caretipHtmlSplash === true,
  );

  const markAppShellReady = useCallback(() => {
    setShellReady(true);
  }, []);

  const setRouteTransitionPendingStable = useCallback((_pending: boolean) => {
    // Route transitions use the single global overlay — no second spinner.
  }, []);

  useLayoutEffect(() => {
    document.querySelector(".caretip-initial-splash")?.remove();
    delete window.__caretipHtmlSplash;
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    const id = window.setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS_PWA);
    return () => window.clearTimeout(id);
  }, [isStandalone]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setShellReady(true);
    }, SHELL_READY_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!minElapsed || !shellReady) return;
    setPhase("exit");
    const id = window.setTimeout(() => setPhase("off"), CARETIP_LOADER_FADE_MS);
    return () => window.clearTimeout(id);
  }, [minElapsed, shellReady]);

  const launchOverlayMounted = phase !== "off";
  const revealed = phase === "off";

  const value = useMemo(
    () => ({
      markAppShellReady,
      setRouteTransitionPending: setRouteTransitionPendingStable,
      revealed,
    }),
    [markAppShellReady, setRouteTransitionPendingStable, revealed],
  );

  return (
    <AppLoadingSplashContext.Provider value={value}>
      <LaunchSplashVisibilityProvider active={launchOverlayMounted}>
        <div
          className={cn(
            "caretip-app-shell min-h-[100dvh] min-w-0",
            !revealed && "caretip-app-shell--behind-loader",
            revealed && "caretip-app-shell--revealed",
          )}
        >
          {children}
        </div>
        {launchOverlayMounted ? (
          <CareTipLoadingOverlay
            seamless={seamlessHandoff}
            steady={seamlessHandoff || phase === "exit"}
            exiting={phase === "exit"}
          />
        ) : null}
      </LaunchSplashVisibilityProvider>
    </AppLoadingSplashContext.Provider>
  );
}
