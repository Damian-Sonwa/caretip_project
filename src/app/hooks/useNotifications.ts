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
import {
  getPageSessionCache,
  setPageSessionCache,
  PAGE_CACHE_TTL_HIGH_MS,
} from "../lib/pageSessionCache";

export type NotificationListFilters = {
  kind?: "support" | "other";
  q?: string;
  supportStatus?: string;
};

type UseNotificationsOptions = {
  /** Caller intends notifications when the user is signed in (role checks, etc.). */
  enabled: boolean;
  /** Prefetch list when dropdown opens */
  loadList?: boolean;
  /** Server-side inbox filters (My Inbox page). */
  listFilters?: NotificationListFilters;
};

export function useNotifications({
  enabled,
  loadList = false,
  listFilters,
}: UseNotificationsOptions) {
  const apiReady = isProtectedApiReady();
  const active = enabled && apiReady;
  const socketReady = useDeferSocketConnect(active);
  const { socket, connected } = useSocket(socketReady);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const itemsRef = useRef<InboxNotification[] | null>(null);
  itemsRef.current = items;

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

  const filterKey = JSON.stringify(listFilters ?? {});

  const loadNotifications = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null; reset?: boolean }) => {
      if (!active) return;
      const inboxCacheKey = `notifications:inbox:${filterKey}`;
      const cachedInbox = getPageSessionCache<{
        items: InboxNotification[];
        unreadCount: number;
        nextCursor: string | null;
      }>(inboxCacheKey, PAGE_CACHE_TTL_HIGH_MS);
      const hasVisible = (itemsRef.current?.length ?? 0) > 0;
      const useCachedFirst =
        !opts?.append && !opts?.cursor && cachedInbox !== null && !hasVisible;
      if (useCachedFirst) {
        setItems(cachedInbox.items);
        setUnreadCount(cachedInbox.unreadCount);
        setNextCursor(cachedInbox.nextCursor);
        setLoading(false);
      } else if (!hasVisible || opts?.append) {
        setLoading(true);
      }
      try {
        const res = await fetchMyNotifications({
          limit: 25,
          cursor: opts?.cursor ?? undefined,
          kind: listFilters?.kind,
          q: listFilters?.q,
          supportStatus: listFilters?.supportStatus,
        });
        setUnreadCount(res.unreadCount);
        setNextCursor(res.nextCursor);
        const nextItems = res.items;
        setItems((prev) =>
          opts?.append && !opts?.reset ? [...(prev ?? []), ...nextItems] : nextItems,
        );
        if (!opts?.append && !opts?.cursor) {
          setPageSessionCache(inboxCacheKey, {
            items: nextItems,
            unreadCount: res.unreadCount,
            nextCursor: res.nextCursor,
          });
        }
        loadedRef.current = true;
      } catch (err) {
        if (!isApiConnectivityError(err)) {
          logClientError("useNotifications.load", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [active, filterKey, listFilters?.kind, listFilters?.q, listFilters?.supportStatus],
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
    // Inbox/list fetch returns unreadCount — skip duplicate unread-only request.
    if (loadList) return;
    void refreshUnread();
  }, [active, loadList, refreshUnread]);

  useEffect(() => {
    if (!active || !loadList) return;
    const inboxCacheKey = `notifications:inbox:${filterKey}`;
    const cachedInbox = getPageSessionCache<{
      items: InboxNotification[];
      unreadCount: number;
      nextCursor: string | null;
    }>(inboxCacheKey, PAGE_CACHE_TTL_HIGH_MS);
    if (cachedInbox) {
      setItems(cachedInbox.items);
      setUnreadCount(cachedInbox.unreadCount);
      setNextCursor(cachedInbox.nextCursor);
      loadedRef.current = true;
    } else {
      setItems([]);
      loadedRef.current = false;
    }
    void loadNotifications({ reset: true });
  }, [active, loadList, loadNotifications, filterKey]);

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
