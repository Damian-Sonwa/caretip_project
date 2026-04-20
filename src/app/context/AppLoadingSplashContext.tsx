import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CareTipLoadingTitle } from "../components/CareTipPageLoader";
import { LoadingSpinner } from "../components/ui/loading-spinner";

/**
 * Launch splash (CareTip + spinner): installed PWA / standalone only — first paint & hydration.
 * Not used for in-app SPA navigations (those use {@link RouteTransitionOverlay}).
 */
const MIN_VISIBLE_MS_PWA = 450;
const EXIT_TRANSITION_MS = 480;
/** If layout never signals (e.g. unusual error routes), still dismiss splash. */
const SHELL_READY_FALLBACK_MS = 8000;

type Phase = "on" | "exit" | "off";

type AppLoadingSplashContextValue = {
  markAppShellReady: () => void;
  /** Branded overlay during SPA route transitions (hidden while launch splash is active). */
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
        "fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6",
        "bg-[#FAF9F6] text-foreground",
        "transition-[opacity,transform,filter] duration-[480ms] ease-out motion-reduce:transition-none",
        exiting ? "pointer-events-none opacity-0 scale-[0.98]" : "opacity-100 scale-100",
      ].join(" ")}
      aria-busy={!exiting}
      aria-live="polite"
      role="status"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <CareTipLoadingTitle />
        <div className="mt-7 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      </div>
    </div>
  );
}

/** Branded CareTip + spinner during SPA route transitions only. */
function RouteTransitionOverlay() {
  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6",
        "bg-background/95 text-foreground backdrop-blur-sm",
      ].join(" ")}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <CareTipLoadingTitle />
        <div className="mt-7 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      </div>
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

  const [phase, setPhase] = useState<Phase>(isStandalone ? "on" : "off");
  const [minElapsed, setMinElapsed] = useState(!isStandalone);
  const [shellReady, setShellReady] = useState(!isStandalone);
  const [routeTransitionPending, setRouteTransitionPending] = useState(false);

  const markAppShellReady = useCallback(() => {
    setShellReady(true);
  }, []);

  const setRouteTransitionPendingStable = useCallback((pending: boolean) => {
    setRouteTransitionPending(pending);
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    const id = window.setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS_PWA);
    return () => window.clearTimeout(id);
  }, [isStandalone]);

  useEffect(() => {
    if (!isStandalone) return;
    const id = window.setTimeout(() => {
      setShellReady((s) => s || true);
    }, SHELL_READY_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [isStandalone]);

  useEffect(() => {
    if (!isStandalone) return;
    if (!minElapsed || !shellReady) return;
    setPhase("exit");
    const id = window.setTimeout(() => setPhase("off"), EXIT_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [isStandalone, minElapsed, shellReady]);

  const value = useMemo(
    () => ({
      markAppShellReady,
      setRouteTransitionPending: setRouteTransitionPendingStable,
    }),
    [markAppShellReady, setRouteTransitionPendingStable]
  );

  const launchActive = phase !== "off";
  const showRouteOverlay = !launchActive && routeTransitionPending;

  return (
    <AppLoadingSplashContext.Provider value={value}>
      {children}
      {launchActive ? (
        <BrandedLoadingSplashOverlay phase={phase === "exit" ? "exit" : "on"} />
      ) : null}
      {showRouteOverlay ? <RouteTransitionOverlay /> : null}
    </AppLoadingSplashContext.Provider>
  );
}
