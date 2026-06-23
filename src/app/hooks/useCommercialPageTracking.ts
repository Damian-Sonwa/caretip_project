import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  featureKeysForPathname,
  queueFeatureUtilization,
} from "../lib/commercial/featureUtilizationTracker";

/** Sprint 7B — debounced page-visit utilization (managers only). */
export function useCommercialPageTracking(enabled: boolean) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!enabled) return;
    const keys = featureKeysForPathname(pathname);
    queueFeatureUtilization(keys);
  }, [enabled, pathname]);
}
