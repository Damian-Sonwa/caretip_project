import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { resolveApiBaseUrl } from "../lib/apiOrigin";

/** Same origin as REST: VITE_API_URL or current origin (Vite proxy for /socket.io in dev). */
function getSocketUrl(): string {
  const base = resolveApiBaseUrl();
  if (base) return base;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export type SocketConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

/**
 * Authenticated Socket.io connection with automatic reconnection (mobile-friendly).
 * Only connects when `enabled` and a Caretip JWT exist.
 * Ping/heartbeat is handled by the engine; server uses pingInterval/pingTimeout.
 */
export function useSocket(enabled: boolean) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>("idle");

  useEffect(() => {
    const url = getSocketUrl();
    if (!enabled || !url) {
      setSocket(null);
      setConnected(false);
      setConnectionStatus("idle");
      return;
    }

    const token = localStorage.getItem("caretip_token");
    if (!token) {
      setSocket(null);
      setConnected(false);
      setConnectionStatus("idle");
      return;
    }

    setConnectionStatus("connecting");
    const s = io(url, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    const onConnect = () => {
      setConnected(true);
      setConnectionStatus("connected");
    };
    const onDisconnect = () => {
      setConnected(false);
      setConnectionStatus("disconnected");
    };
    const onConnectError = () => {
      setConnected(false);
      setConnectionStatus("disconnected");
    };
    const onReconnectAttempt = () => setConnectionStatus("reconnecting");
    const onReconnect = () => {
      setConnected(true);
      setConnectionStatus("connected");
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.io.on("reconnect_attempt", onReconnectAttempt);
    s.io.on("reconnect", onReconnect);

    setSocket(s);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.io.off("reconnect_attempt", onReconnectAttempt);
      s.io.off("reconnect", onReconnect);
      s.removeAllListeners();
      s.close();
      setSocket(null);
      setConnected(false);
      setConnectionStatus("idle");
    };
  }, [enabled]);

  return { socket, connected, connectionStatus };
}

/**
 * Delays enabling the socket to the next macrotask so route paint and critical
 * fetches are not blocked by the WebSocket handshake.
 */
export function useDeferSocketConnect(shouldConnect: boolean): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!shouldConnect) {
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, [shouldConnect]);
  return ready;
}
