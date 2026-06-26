/** Sprint 5E + Sprint 8.1 — dev/runtime counters for realtime vs refetch. */

type Counters = {
  socketEventsProcessed: number;
  socketPatchesApplied: number;
  analyticsRefetches: number;
  analyticsCacheHits: number;
  analyticsCacheMisses: number;
  qrRefetches: number;
  notificationRefetches: number;
  notificationSocketEvents: number;
  venueCatalogFetches: number;
  venueCatalogCacheHits: number;
  venueCatalogCacheMisses: number;
  lastSocketPatchMs: number | null;
  lastRefetchMs: number | null;
};

const counters: Counters = {
  socketEventsProcessed: 0,
  socketPatchesApplied: 0,
  analyticsRefetches: 0,
  analyticsCacheHits: 0,
  analyticsCacheMisses: 0,
  qrRefetches: 0,
  notificationRefetches: 0,
  notificationSocketEvents: 0,
  venueCatalogFetches: 0,
  venueCatalogCacheHits: 0,
  venueCatalogCacheMisses: 0,
  lastSocketPatchMs: null,
  lastRefetchMs: null,
};

export function trackSocketEventProcessed(): void {
  counters.socketEventsProcessed += 1;
}

export function trackSocketPatchApplied(): void {
  counters.socketPatchesApplied += 1;
  counters.lastSocketPatchMs = Date.now();
}

export function trackAnalyticsRefetch(): void {
  counters.analyticsRefetches += 1;
  counters.lastRefetchMs = Date.now();
}

export function trackAnalyticsCacheHit(): void {
  counters.analyticsCacheHits += 1;
}

export function trackAnalyticsCacheMiss(): void {
  counters.analyticsCacheMisses += 1;
}

export function trackVenueCatalogFetch(): void {
  counters.venueCatalogFetches += 1;
}

export function trackVenueCatalogCacheHit(): void {
  counters.venueCatalogCacheHits += 1;
}

export function trackVenueCatalogCacheMiss(): void {
  counters.venueCatalogCacheMisses += 1;
}

export function trackQrRefetch(): void {
  counters.qrRefetches += 1;
  counters.lastRefetchMs = Date.now();
}

export function trackNotificationRefetch(): void {
  counters.notificationRefetches += 1;
  counters.lastRefetchMs = Date.now();
}

export function trackNotificationSocketEvent(): void {
  counters.notificationSocketEvents += 1;
  counters.lastSocketPatchMs = Date.now();
}

export function getRealtimeMetricsSnapshot(): Readonly<Counters> {
  return { ...counters };
}

export function resetRealtimeMetricsForTests(): void {
  counters.socketEventsProcessed = 0;
  counters.socketPatchesApplied = 0;
  counters.analyticsRefetches = 0;
  counters.analyticsCacheHits = 0;
  counters.analyticsCacheMisses = 0;
  counters.qrRefetches = 0;
  counters.notificationRefetches = 0;
  counters.notificationSocketEvents = 0;
  counters.venueCatalogFetches = 0;
  counters.venueCatalogCacheHits = 0;
  counters.venueCatalogCacheMisses = 0;
  counters.lastSocketPatchMs = null;
  counters.lastRefetchMs = null;
}
