import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMyNotifications,
  fetchMyUnreadNotificationCount,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  type InboxNotification,
} from "../lib/api";
import { useSocket } from "./useSocket";
import { logClientError } from "../lib/clientLog";

type UseNotificationsOptions = {
  enabled: boolean;
  /** Prefetch list when dropdown opens */
  loadList?: boolean;
};

export function useNotifications({ enabled, loadList = false }: UseNotificationsOptions) {
  const { socket, connected } = useSocket(enabled);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const { unreadCount: count } = await fetchMyUnreadNotificationCount();
      setUnreadCount(count);
    } catch (err) {
      logClientError("useNotifications.refreshUnread", err);
    }
  }, [enabled]);

  const loadNotifications = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      if (!enabled) return;
      setLoading(true);
      try {
        const res = await fetchMyNotifications({
          limit: 25,
          cursor: opts?.cursor ?? undefined,
        });
        setUnreadCount(res.unreadCount);
        setNextCursor(res.nextCursor);
        setItems((prev) =>
          opts?.append ? [...prev, ...res.items] : res.items,
        );
        loadedRef.current = true;
      } catch (err) {
        logClientError("useNotifications.load", err);
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  const markRead = useCallback(async (id: string) => {
    try {
      const res = await markNotificationReadApi(id);
      setUnreadCount(res.unreadCount);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: res.notification.readAt } : n)),
      );
    } catch (err) {
      logClientError("useNotifications.markRead", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await markAllNotificationsReadApi();
      setUnreadCount(res.unreadCount);
      setItems((prev) => prev.map((n) => ({ ...n, read: true, readAt: n.readAt ?? new Date().toISOString() })));
    } catch (err) {
      logClientError("useNotifications.markAllRead", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      setItems([]);
      return;
    }
    void refreshUnread();
  }, [enabled, refreshUnread]);

  useEffect(() => {
    if (!enabled || !loadList) return;
    if (!loadedRef.current) void loadNotifications();
  }, [enabled, loadList, loadNotifications]);

  useEffect(() => {
    if (!socket || !enabled) return;

    const onCreated = (payload: { notification?: InboxNotification; unreadCount?: number }) => {
      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
      if (payload.notification) {
        setItems((prev) => {
          if (prev.some((n) => n.id === payload.notification!.id)) return prev;
          return [payload.notification!, ...prev].slice(0, 50);
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
  }, [socket, enabled]);

  useEffect(() => {
    if (!enabled || !connected) return;
    void refreshUnread();
  }, [connected, enabled, refreshUnread]);

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
