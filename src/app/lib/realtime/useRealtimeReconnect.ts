import { useEffect, useRef } from "react";
import { SOCKET_RECONNECTED_EVENT } from "./realtimeContracts";

/** Sprint 5D — catch-up when socket reconnects after disconnect. */
export function useRealtimeReconnect(onReconnect: () => void, enabled = true): void {
  const cbRef = useRef(onReconnect);
  cbRef.current = onReconnect;

  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      cbRef.current();
    };
    window.addEventListener(SOCKET_RECONNECTED_EVENT, handler);
    return () => window.removeEventListener(SOCKET_RECONNECTED_EVENT, handler);
  }, [enabled]);
}
