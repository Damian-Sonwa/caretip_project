/** Sprint 5E — dev/runtime counters for realtime vs refetch. */

type Counters = {
  socketEventsProcessed: number;
  socketPatchesApplied: number;
  analyticsRefetches: number;
  qrRefetches: number;
  notificationRefetches: number;
  lastSocketPatchMs: number | null;
  lastRefetchMs: number | null;
};

const counters: Counters = {
  socketEventsProcessed: 0,
  socketPatchesApplied: 0,
  analyticsRefetches: 0,
  qrRefetches: 0,
  notificationRefetches: 0,
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

export function trackQrRefetch(): void {
  counters.qrRefetches += 1;
  counters.lastRefetchMs = Date.now();
}

export function trackNotificationRefetch(): void {
  counters.notificationRefetches += 1;
  counters.lastRefetchMs = Date.now();
}

export function getRealtimeMetricsSnapshot(): Readonly<Counters> {
  return { ...counters };
}

export function resetRealtimeMetricsForTests(): void {
  counters.socketEventsProcessed = 0;
  counters.socketPatchesApplied = 0;
  counters.analyticsRefetches = 0;
  counters.qrRefetches = 0;
  counters.notificationRefetches = 0;
  counters.lastSocketPatchMs = null;
  counters.lastRefetchMs = null;
}
