import type { NotificationPriority } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { sendLocalizedUserNotificationEmail } from "../localizedNotificationEmail.service.js";
import { sendNotification } from "../push/notification.service.js";
import type { NotificationPayload, NotificationType } from "../push/notification.types.js";
import {
  createInboxNotification,
  getUnreadNotificationCount,
  type InboxNotificationDto,
} from "./notificationInbox.service.js";
import {
  emitNotificationCreated,
  emitNotificationUnreadCount,
} from "../../socket/socketEmitters.js";

export type DeliveryChannel = "in_app" | "push" | "email";

export type DeliverNotificationInput = {
  userId: string;
  payload: NotificationPayload;
  channels?: Partial<Record<DeliveryChannel, boolean>>;
  priority?: NotificationPriority;
  dedupeKey?: string;
  bypassPreferences?: boolean;
};

const DEFAULT_CHANNELS: Record<DeliveryChannel, boolean> = {
  in_app: true,
  push: true,
  email: false,
};

function resolveChannels(
  type: NotificationType,
  overrides?: Partial<Record<DeliveryChannel, boolean>>,
): DeliveryChannel[] {
  const base = { ...DEFAULT_CHANNELS };
  if (type === "new_login") base.email = true;
  const merged = { ...base, ...overrides };
  return (Object.keys(merged) as DeliveryChannel[]).filter((k) => merged[k]);
}

export async function deliverUserNotification(
  input: DeliverNotificationInput,
): Promise<{ notification: InboxNotificationDto | null; skipped: boolean }> {
  const channels = resolveChannels(input.payload.type, input.channels);
  const dedupeKey =
    input.dedupeKey ??
    `${input.payload.type}:${input.userId}:${input.payload.metadata?.entityId ?? input.payload.title}`;

  const metadata: Record<string, unknown> = {
    ...(input.payload.metadata ?? {}),
    ...(input.payload.url ? { url: input.payload.url } : {}),
  };

  let notification: InboxNotificationDto | null = null;

  if (channels.includes("in_app")) {
    notification = await createInboxNotification({
      userId: input.userId,
      type: input.payload.type,
      title: input.payload.title,
      message: input.payload.body,
      metadata,
      priority: input.priority ?? "normal",
      channels,
      dedupeKey,
    });
    if (!notification) return { notification: null, skipped: true };

    const unread = await getUnreadNotificationCount(input.userId);
    emitNotificationCreated(input.userId, { notification, unreadCount: unread });
    emitNotificationUnreadCount(input.userId, unread);
  }

  if (channels.includes("push")) {
    await sendNotification(input.userId, input.payload, {
      bypassPreferences: input.bypassPreferences,
      dedupeKey: `push:${dedupeKey}`,
    });
  }

  if (channels.includes("email")) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, preferredLocale: true },
    });
    if (user?.email) {
      void sendLocalizedUserNotificationEmail({
        to: user.email,
        userId: input.userId,
        explicitLocale: user.preferredLocale,
        title: input.payload.title,
        bodyText: input.payload.body,
        actionUrl: input.payload.url ?? null,
      }).catch(() => undefined);
    }
  }

  return { notification, skipped: false };
}

export async function deliverNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload,
  options?: Omit<DeliverNotificationInput, "userId" | "payload"> & {
    dedupeKeyPrefix?: string;
  },
): Promise<{ delivered: number; skipped: number }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  let delivered = 0;
  let skipped = 0;
  for (const userId of unique) {
    const dedupeKey = options?.dedupeKeyPrefix
      ? `${options.dedupeKeyPrefix}:${userId}`
      : options?.dedupeKey;
    const result = await deliverUserNotification({
      userId,
      payload,
      channels: options?.channels,
      priority: options?.priority,
      dedupeKey,
      bypassPreferences: options?.bypassPreferences,
    });
    if (result.skipped) skipped += 1;
    else delivered += 1;
  }
  return { delivered, skipped };
}
