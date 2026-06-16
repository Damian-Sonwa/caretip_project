import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { fetchPublicSocketRoomToken } from "../lib/api";
import { resolveApiBaseUrl } from "../lib/apiOrigin";

function getSocketUrl(): string {
  const base = resolveApiBaseUrl();
  if (base) return base;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export type PublicSocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "reconnecting";

/**
 * Read-only Socket.io for guest flows: requires a short-lived signed `publicRoomToken`
 * from GET /api/socket/public-room-token before joining `public:business:{id}`.
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

    let cancelled = false;
    let activeSocket: Socket | null = null;

    const connect = async () => {
      setConnectionStatus("connecting");
      try {
        const { token } = await fetchPublicSocketRoomToken({ businessId });
        if (cancelled) return;

        const s = io(url, {
          auth: { publicRoomToken: token },
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

        activeSocket = s;
        setSocket(s);
      } catch {
        if (!cancelled) {
          setSocket(null);
          setConnected(false);
          setConnectionStatus("disconnected");
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (activeSocket) {
        activeSocket.removeAllListeners();
        activeSocket.close();
      }
      setSocket(null);
      setConnected(false);
      setConnectionStatus("idle");
    };
  }, [businessId]);

  return { socket, connected, connectionStatus };
}
