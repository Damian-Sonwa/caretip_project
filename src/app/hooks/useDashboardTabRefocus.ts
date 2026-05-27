import { useEffect, useRef } from "react";

const REFOCUS_DEBOUNCE_MS = 450;
const subscribers = new Set<() => void>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let listenerInstalled = false;

function flushTabRefocus() {
  debounceTimer = null;
  for (const fn of subscribers) {
    try {
      fn();
    } catch {
      // Subscriber errors must not break other dashboard refetches.
    }
  }
}

function scheduleTabRefocus() {
  if (debounceTimer != null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushTabRefocus, REFOCUS_DEBOUNCE_MS);
}

function installTabRefocusListener() {
  if (listenerInstalled || typeof document === "undefined") return;
  listenerInstalled = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && subscribers.size > 0) {
      scheduleTabRefocus();
    }
  });
}

/**
 * Refetch live dashboard data when the user returns to the tab.
 * Multiple subscribers share one debounced visibility listener (no refocus storms).
 */
export function useDashboardTabRefocus(onRefocus: () => void, enabled: boolean) {
  const onRefocusRef = useRef(onRefocus);
  onRefocusRef.current = onRefocus;

  useEffect(() => {
    if (!enabled) return;
    installTabRefocusListener();
    const handler = () => onRefocusRef.current();
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, [enabled]);
}
