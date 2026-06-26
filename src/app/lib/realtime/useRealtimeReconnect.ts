import { useEffect, useRef } from "react";
import { SOCKET_CONNECTED_EVENT, SOCKET_RECONNECTED_EVENT } from "./realtimeContracts";

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

/** Catch-up on initial connect and reconnect (missed events while offline or logging in). */
export function useSocketCatchUp(onCatchUp: () => void, enabled = true): void {
  const cbRef = useRef(onCatchUp);
  cbRef.current = onCatchUp;

  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      cbRef.current();
    };
    window.addEventListener(SOCKET_CONNECTED_EVENT, handler);
    window.addEventListener(SOCKET_RECONNECTED_EVENT, handler);
    return () => {
      window.removeEventListener(SOCKET_CONNECTED_EVENT, handler);
      window.removeEventListener(SOCKET_RECONNECTED_EVENT, handler);
    };
  }, [enabled]);
}
