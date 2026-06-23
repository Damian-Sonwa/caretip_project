import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { resolveApiBaseUrl } from "../lib/apiOrigin";
import { AUTH_STORAGE_SYNC_EVENT } from "../lib/authStorageSync";
import { getMemoryAccessToken } from "../lib/accessTokenStore";

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

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
  connectionStatus: SocketConnectionStatus;
  registerInterest: () => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Single authenticated Socket.IO connection shared across the app.
 * Consumers call registerInterest() while they need realtime; connection
 * closes when the last consumer releases (e.g. logout / unmount).
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const interestRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>("idle");

  const disconnect = useCallback(() => {
    const s = socketRef.current;
    if (s) {
      s.removeAllListeners();
      s.close();
    }
    socketRef.current = null;
    setSocket(null);
    setConnected(false);
    setConnectionStatus("idle");
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }

    const url = getSocketUrl();
    const token = getMemoryAccessToken();
    if (!url || !token) {
      setConnectionStatus("idle");
      return;
    }

    setConnectionStatus("connecting");
    const { io } = await import("socket.io-client");
    const s = io(url, {
      auth: { token },
      // Polling first: Render cold starts often reject the initial WebSocket upgrade.
      transports: ["polling", "websocket"],
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("caretip:socket-reconnected"));
      }
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.io.on("reconnect_attempt", onReconnectAttempt);
    s.io.on("reconnect", onReconnect);

    socketRef.current = s;
    setSocket(s);
  }, []);

  const registerInterest = useCallback(() => {
    interestRef.current += 1;
    if (interestRef.current === 1) connect();
    return () => {
      interestRef.current = Math.max(0, interestRef.current - 1);
      if (interestRef.current === 0) disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    const reconnectWithFreshToken = () => {
      if (interestRef.current <= 0) return;
      disconnect();
      connect();
    };
    const onAuthSync = () => reconnectWithFreshToken();
    window.addEventListener(AUTH_STORAGE_SYNC_EVENT, onAuthSync);
    return () => {
      window.removeEventListener(AUTH_STORAGE_SYNC_EVENT, onAuthSync);
    };
  }, [connect, disconnect]);

  const value = useMemo(
    () => ({ socket, connected, connectionStatus, registerInterest }),
    [socket, connected, connectionStatus, registerInterest],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * Subscribe to the shared authenticated socket while `enabled` is true.
 * Does not create a new connection — ref-counted via SocketProvider.
 */
export function useSocket(enabled: boolean) {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  const { socket, connected, connectionStatus, registerInterest } = ctx;

  useEffect(() => {
    if (!enabled) return;
    return registerInterest();
  }, [enabled, registerInterest]);

  if (!enabled) {
    return {
      socket: null as Socket | null,
      connected: false,
      connectionStatus: "idle" as SocketConnectionStatus,
    };
  }

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
