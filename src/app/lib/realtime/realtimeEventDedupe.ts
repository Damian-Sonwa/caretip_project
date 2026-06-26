/** Sprint 5D — idempotent realtime event processing (duplicate protection). */

const seenEventIds = new Set<string>();
const seenNotificationIds = new Set<string>();
const MAX_SEEN = 500;

function pruneSeen(set: Set<string>): void {
  if (set.size <= MAX_SEEN) return;
  const drop = [...set].slice(0, set.size - MAX_SEEN + 50);
  for (const id of drop) set.delete(id);
}

export function shouldProcessRealtimeEvent(eventId: string | undefined | null): boolean {
  if (!eventId?.trim()) return true;
  if (seenEventIds.has(eventId)) return false;
  seenEventIds.add(eventId);
  pruneSeen(seenEventIds);
  return true;
}

/** Dedupe inbox notifications across legacy + canonical socket events. */
export function shouldProcessNotificationRealtime(
  eventId: string | undefined | null,
  notificationId: string | undefined | null,
): boolean {
  const nid = notificationId?.trim();
  if (nid) {
    if (seenNotificationIds.has(nid)) return false;
    seenNotificationIds.add(nid);
    pruneSeen(seenNotificationIds);
  }
  return shouldProcessRealtimeEvent(eventId ?? nid);
}

export function resetRealtimeEventDedupeForTests(): void {
  seenEventIds.clear();
  seenNotificationIds.clear();
}
