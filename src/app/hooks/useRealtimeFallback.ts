import { useEffect, useRef } from "react";

/**
 * When the realtime socket is disconnected, periodically refresh from the database.
 * When connected, no polling — websocket is primary.
 */
export function useRealtimeFallback(
  connected: boolean,
  onRefresh: () => void | Promise<void>,
  intervalMs = 45000
) {
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    if (connected) return;
    const id = window.setInterval(() => {
      void Promise.resolve(cb.current());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [connected, intervalMs]);
}
