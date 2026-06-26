import type { InboxNotification } from "../api";
import type { RealtimeEventEnvelope } from "./realtimeContracts";

export type NotificationCreatedBody = {
  notification?: InboxNotification;
  unreadCount?: number;
  at?: string;
};

type NotificationCreatedRaw =
  | NotificationCreatedBody
  | RealtimeEventEnvelope<NotificationCreatedBody>;

export type ParsedNotificationCreated = {
  notification?: InboxNotification;
  unreadCount?: number;
  eventId?: string;
  notificationId?: string;
};

/** Normalize legacy flat payloads and canonical realtime envelopes. */
export function parseNotificationCreatedPayload(raw: unknown): ParsedNotificationCreated | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if ("payload" in obj && obj.payload && typeof obj.payload === "object") {
    const inner = obj.payload as NotificationCreatedBody;
    const notification = inner.notification;
    return {
      notification,
      unreadCount: typeof inner.unreadCount === "number" ? inner.unreadCount : undefined,
      eventId: typeof obj.eventId === "string" ? obj.eventId : undefined,
      notificationId: notification?.id,
    };
  }

  const notification = obj.notification as InboxNotification | undefined;
  return {
    notification,
    unreadCount: typeof obj.unreadCount === "number" ? obj.unreadCount : undefined,
    eventId: typeof obj.eventId === "string" ? obj.eventId : notification?.id,
    notificationId: notification?.id,
  };
}
