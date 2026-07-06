import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CareTipBrandLoader } from "../components/CareTipBrandLoader";
import { LaunchSplashVisibilityProvider } from "./AppLoadingManager";

/**
 * Launch splash: first paint through app shell ready (all surfaces).
 * PWA keeps a short minimum visible time so the mark does not flash.
 */
const MIN_VISIBLE_MS_PWA = 420;
const EXIT_TRANSITION_MS = 420;
/** If layout never signals (e.g. unusual error routes), still dismiss splash. */
const SHELL_READY_FALLBACK_MS = 8000;

type Phase = "on" | "exit" | "off";

type AppLoadingSplashContextValue = {
  markAppShellReady: () => void;
  /** Branded overlay during SPA route transitions (reserved — global overlay handles transitions). */
  setRouteTransitionPending: (pending: boolean) => void;
};

const AppLoadingSplashContext = createContext<AppLoadingSplashContextValue | null>(
  null
);

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

/**
 * Optional: routes outside the provider can no-op (should not happen in production).
 */
export function useMarkAppShellReadyOptional() {
  return useContext(AppLoadingSplashContext)?.markAppShellReady;
}

function BrandedLoadingSplashOverlay({
  phase,
}: {
  phase: "on" | "exit";
}) {
  const exiting = phase === "exit";

  return (
    <div
      className={[
        "caretip-launch-splash fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6",
        "bg-background text-foreground",
        exiting ? "caretip-launch-splash--exiting" : "",
      ].join(" ")}
      aria-busy={!exiting}
      aria-live="polite"
      role="status"
      aria-label="Loading CareTip"
    >
      <CareTipBrandLoader showMessage={false} />
    </div>
  );
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
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true
    );
  }, []);

  const [phase, setPhase] = useState<Phase>("on");
  const [minElapsed, setMinElapsed] = useState(!isStandalone);
  const [shellReady, setShellReady] = useState(false);

  const markAppShellReady = useCallback(() => {
    setShellReady(true);
  }, []);

  const setRouteTransitionPendingStable = useCallback((_pending: boolean) => {
    // Route transitions use the single global overlay — no second spinner.
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    const id = window.setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS_PWA);
    return () => window.clearTimeout(id);
  }, [isStandalone]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setShellReady((s) => s || true);
    }, SHELL_READY_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!minElapsed || !shellReady) return;
    setPhase("exit");
    const id = window.setTimeout(() => setPhase("off"), EXIT_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [minElapsed, shellReady]);

  const value = useMemo(
    () => ({
      markAppShellReady,
      setRouteTransitionPending: setRouteTransitionPendingStable,
    }),
    [markAppShellReady, setRouteTransitionPendingStable]
  );

  const launchActive = phase !== "off";

  return (
    <AppLoadingSplashContext.Provider value={value}>
      <LaunchSplashVisibilityProvider active={launchActive}>
        {children}
        {launchActive ? (
          <BrandedLoadingSplashOverlay phase={phase === "exit" ? "exit" : "on"} />
        ) : null}
      </LaunchSplashVisibilityProvider>
    </AppLoadingSplashContext.Provider>
  );
}
