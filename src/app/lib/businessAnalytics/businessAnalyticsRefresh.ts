import { clearBusinessStatsClientCache } from "../api";
import { clearBusinessAnalyticsStore } from "./businessAnalyticsStore";
import type { AnalyticsTimeframe } from "./types";

type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();

/** Subscribe to coordinated analytics invalidation (socket, tab refocus, manual refresh). */
export function subscribeBusinessAnalyticsRefresh(listener: RefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Invalidate API + in-memory analytics bundles, then notify all subscribers.
 * Sprint 3E: Overview, Analytics, and Performance stay in sync without live patches.
 */
export function invalidateBusinessAnalytics(timeframe?: AnalyticsTimeframe | "all"): void {
  if (timeframe && timeframe !== "all") {
    clearBusinessStatsClientCache(timeframe);
    clearBusinessAnalyticsStore(timeframe);
  } else {
    clearBusinessStatsClientCache();
    clearBusinessAnalyticsStore();
  }
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // isolate subscriber failures
    }
  }
}
