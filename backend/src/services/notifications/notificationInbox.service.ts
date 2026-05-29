import type { NotificationPriority, Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const DEDUPE_WINDOW_MS = 60_000;

export type InboxNotificationDto = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  priority: NotificationPriority;
  channels: string[];
  read: boolean;
  readAt: string | null;
  createdAt: string;
  url: string | null;
};

function metadataUrl(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const url = (metadata as Record<string, unknown>).url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function toInboxDto(row: {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  priority: NotificationPriority;
  channels: string[];
  readAt: Date | null;
  createdAt: Date;
}): InboxNotificationDto {
  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    metadata: meta,
    priority: row.priority,
    channels: row.channels,
    read: row.readAt != null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    url: metadataUrl(meta),
  };
}

export async function findRecentDuplicateNotification(
  userId: string,
  dedupeKey: string,
): Promise<{ id: string } | null> {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  return prisma.notification.findFirst({
    where: { userId, dedupeKey, createdAt: { gte: since } },
    select: { id: true },
  });
}

export async function createInboxNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
  channels: string[];
  dedupeKey?: string;
}): Promise<InboxNotificationDto | null> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || !message) return null;

  if (input.dedupeKey) {
    const dup = await findRecentDuplicateNotification(input.userId, input.dedupeKey);
    if (dup) return null;
  }

  const metadata = (input.metadata ?? {}) as Prisma.InputJsonValue;

  try {
    const row = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title,
        message,
        metadata,
        priority: input.priority ?? "normal",
        channels: input.channels,
        dedupeKey: input.dedupeKey ?? null,
      },
    });
    return toInboxDto(row);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code === "P2002" && input.dedupeKey) return null;
    throw err;
  }
}

const SUPPORT_TYPES = [
  "support_ticket_created",
  "support_ticket_reply",
  "support_ticket_status",
] as const;

export async function listUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    cursor?: string;
    unreadOnly?: boolean;
    /** `support` = only support ticket alerts; `other` = exclude them */
    kind?: "support" | "other";
    search?: string;
    supportStatus?: string;
  },
): Promise<{ items: InboxNotificationDto[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100);
  const search = options?.search?.trim();
  const supportStatus = options?.supportStatus?.trim().toUpperCase();

  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
      ...(options?.kind === "support"
        ? { type: { in: [...SUPPORT_TYPES] } }
        : options?.kind === "other"
          ? { type: { notIn: [...SUPPORT_TYPES] } }
          : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(supportStatus
        ? {
            metadata: {
              path: ["status"],
              equals: supportStatus,
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map(toInboxDto);
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<InboxNotificationDto | null> {
  const row = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (row.count === 0) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    return existing ? toInboxDto(existing) : null;
  }
  const updated = await prisma.notification.findUnique({ where: { id: notificationId } });
  return updated ? toInboxDto(updated) : null;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
