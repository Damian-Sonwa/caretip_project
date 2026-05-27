import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMyNotifications,
  fetchMyUnreadNotificationCount,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  type InboxNotification,
} from "../lib/api";
import { isProtectedApiReady } from "../lib/authRestore";
import { isApiConnectivityError } from "../lib/errorMessages";
import { logClientError } from "../lib/clientLog";
import { useSocket, useDeferSocketConnect } from "./useSocket";
import { devSetHydrationPhase } from "../lib/dashboardDevDebug";

type UseNotificationsOptions = {
  /** Caller intends notifications when the user is signed in (role checks, etc.). */
  enabled: boolean;
  /** Prefetch list when dropdown opens */
  loadList?: boolean;
};

export function useNotifications({ enabled, loadList = false }: UseNotificationsOptions) {
  const apiReady = isProtectedApiReady();
  const active = enabled && apiReady;
  const socketReady = useDeferSocketConnect(active);
  const { socket, connected } = useSocket(socketReady);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    if (!active) return;
    devSetHydrationPhase("notifications", "loading");
    try {
      const { unreadCount: count } = await fetchMyUnreadNotificationCount();
      setUnreadCount(count);
      devSetHydrationPhase("notifications", "ready");
    } catch (err) {
      if (!isApiConnectivityError(err)) {
        logClientError("useNotifications.refreshUnread", err);
      }
      devSetHydrationPhase("notifications", "error");
    }
  }, [active]);

  const loadNotifications = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      if (!active) return;
      setLoading(true);
      try {
        const res = await fetchMyNotifications({
          limit: 25,
          cursor: opts?.cursor ?? undefined,
        });
        setUnreadCount(res.unreadCount);
        setNextCursor(res.nextCursor);
        const nextItems = res.items;
        setItems((prev) =>
          opts?.append ? [...(prev ?? []), ...nextItems] : nextItems,
        );
        loadedRef.current = true;
      } catch (err) {
        if (!isApiConnectivityError(err)) {
          logClientError("useNotifications.load", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [active],
  );

  const markRead = useCallback(async (id: string) => {
    try {
      const res = await markNotificationReadApi(id);
      setUnreadCount(res.unreadCount);
      setItems((prev) =>
        (prev ?? []).map((n) =>
          n.id === id ? { ...n, read: true, readAt: res.notification.readAt } : n,
        ),
      );
    } catch (err) {
      logClientError("useNotifications.markRead", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await markAllNotificationsReadApi();
      setUnreadCount(res.unreadCount);
      setItems((prev) =>
        (prev ?? []).map((n) => ({
          ...n,
          read: true,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      );
    } catch (err) {
      logClientError("useNotifications.markAllRead", err);
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setUnreadCount(0);
      setItems([]);
      loadedRef.current = false;
      devSetHydrationPhase("notifications", "idle");
      return;
    }
    void refreshUnread();
  }, [active, refreshUnread]);

  useEffect(() => {
    if (!active || !loadList) return;
    if (!loadedRef.current) void loadNotifications();
  }, [active, loadList, loadNotifications]);

  useEffect(() => {
    if (!socket || !active) return;

    const onCreated = (payload: { notification?: InboxNotification; unreadCount?: number }) => {
      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
      if (payload.notification) {
        setItems((prev) => {
          const list = prev ?? [];
          if (list.some((n) => n.id === payload.notification!.id)) return list;
          return [payload.notification!, ...list].slice(0, 50);
        });
      }
    };

    const onUnread = (payload: { unreadCount?: number }) => {
      if (typeof payload.unreadCount === "number") setUnreadCount(payload.unreadCount);
    };

    socket.on("notification_created", onCreated);
    socket.on("notification_unread_count", onUnread);
    return () => {
      socket.off("notification_created", onCreated);
      socket.off("notification_unread_count", onUnread);
    };
  }, [socket, active]);

  useEffect(() => {
    if (!active || !connected) return;
    void refreshUnread();
  }, [connected, active, refreshUnread]);

  return {
    unreadCount,
    items,
    loading,
    nextCursor,
    connected,
    refreshUnread,
    loadNotifications,
    markRead,
    markAllRead,
  };
}
