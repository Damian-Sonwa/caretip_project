import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { resolveApiBaseUrl } from "../lib/apiOrigin";

function getSocketUrl(): string {
  const base = resolveApiBaseUrl();
  if (base) return base;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export type PublicSocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "reconnecting";

/**
 * Read-only Socket.io for guest flows: join `public:business:{id}` using `auth.businessId`
 * (no JWT). Server emits `business_data_updated` / `verification_updated` for live directory refresh.
 */
export function usePublicSocket(businessId: string | null | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<PublicSocketStatus>("idle");

  useEffect(() => {
    const url = getSocketUrl();
    if (!businessId || !url) {
      setSocket(null);
      setConnected(false);
      setConnectionStatus("idle");
      return;
    }

    setConnectionStatus("connecting");
    const s = io(url, {
      auth: { businessId },
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
  }, [businessId]);

  return { socket, connected, connectionStatus };
}
