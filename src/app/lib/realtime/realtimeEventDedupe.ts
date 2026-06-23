/** Sprint 5D — idempotent realtime event processing (duplicate protection). */

const seenEventIds = new Set<string>();
const MAX_SEEN = 500;

export function shouldProcessRealtimeEvent(eventId: string | undefined | null): boolean {
  if (!eventId?.trim()) return true;
  if (seenEventIds.has(eventId)) return false;
  seenEventIds.add(eventId);
  if (seenEventIds.size > MAX_SEEN) {
    const drop = [...seenEventIds].slice(0, seenEventIds.size - MAX_SEEN + 50);
    for (const id of drop) seenEventIds.delete(id);
  }
  return true;
}

export function resetRealtimeEventDedupeForTests(): void {
  seenEventIds.clear();
}
