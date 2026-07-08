import React, { createContext, useCallback, useContext, useMemo } from "react";

type AppLoadingSplashContextValue = {
  /** @deprecated PWA launch uses AppLoadingManager app-boot — kept for route shell hooks. */
  markAppShellReady: () => void;
  setRouteTransitionPending: (pending: boolean) => void;
};

const AppLoadingSplashContext = createContext<AppLoadingSplashContextValue | null>(
  null,
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

/** Optional: routes outside the provider can no-op (should not happen in production). */
export function useMarkAppShellReadyOptional() {
  return useContext(AppLoadingSplashContext)?.markAppShellReady;
}

/**
 * Legacy PWA shell hook — launch splash is unified with AppBrandedLoadingScreen via app-boot.
 */
export function AppLoadingSplashProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const markAppShellReady = useCallback(() => {
    // Route paint + app-boot release handled by RouteNavigationLoadingRegistrar.
  }, []);

  const setRouteTransitionPending = useCallback((_pending: boolean) => {
    // Route transitions use the single global overlay.
  }, []);

  const value = useMemo(
    () => ({
      markAppShellReady,
      setRouteTransitionPending,
    }),
    [markAppShellReady, setRouteTransitionPending],
  );

  return (
    <AppLoadingSplashContext.Provider value={value}>{children}</AppLoadingSplashContext.Provider>
  );
}
