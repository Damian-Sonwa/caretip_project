import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigation } from "react-router";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
  useReleaseAppBootOverlay,
} from "../context/AppLoadingManager";
import { resolveRouteLoadingMessage } from "../lib/appLoadingContexts";
import { shouldRegisterBrandedRouteNavigation } from "../lib/appLoadingJourney";
import { isPublicMarketingPath } from "../lib/publicRoutes";

function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Shows the global branded overlay while React Router resolves lazy route modules.
 * Marketing cold-load `app-boot` is released only after the route is idle and painted,
 * so AppLoadingManager can enforce the existing minimum visible duration.
 */
export function RouteNavigationLoadingRegistrar({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const pending = navigation.state === "loading";
  const brandedRouteNavigation =
    pending && shouldRegisterBrandedRouteNavigation(pathname);
  const releaseAppBootOverlay = useReleaseAppBootOverlay();

  useAppLoadingRegistration(
    "route-navigation",
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    brandedRouteNavigation,
    resolveRouteLoadingMessage(pathname, t),
  );

  useEffect(() => {
    const shouldReleaseBoot =
      isPublicMarketingPath(pathname) || isStandaloneDisplayMode();
    if (!shouldReleaseBoot) return;
    if (navigation.state === "loading") return;

    let cancelled = false;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!cancelled) releaseAppBootOverlay();
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [navigation.state, pathname, releaseAppBootOverlay]);

  return <>{children}</>;
}
