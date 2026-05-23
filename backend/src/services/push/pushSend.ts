import type { BatchResponse } from "firebase-admin/messaging";
import { getFirebaseMessaging, isFcmConfigured } from "./fcmAdmin.js";
import { prisma } from "../../prisma.js";

export const FCM_INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

/** Web clients: one row per FCM token (device/browser). */
export const MAX_PUSH_TOKENS_PER_USER = 10;
export const PUSH_TOKEN_STALE_MS = 90 * 24 * 60 * 60 * 1000;

export type PushDeliveryResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

function logPush(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
): void {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[push] ${message}${suffix}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function stringifyPushData(
  data?: Record<string, string | number | boolean | null | undefined>,
): Record<string, string> {
  if (!data) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    out[key] = String(value);
  }
  return out;
}

export function invalidTokensFromBatch(
  tokens: string[],
  response: BatchResponse,
): string[] {
  const invalid: string[] = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code && FCM_INVALID_TOKEN_CODES.has(r.error.code)) {
      invalid.push(tokens[i]!);
    }
  });
  return invalid;
}

export async function deleteInvalidPushTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await prisma.pushDeviceToken.deleteMany({ where: { token: { in: tokens } } });
  logPush("info", "pruned invalid tokens", { count: tokens.length });
}

/**
 * Data-only multicast for web — avoids duplicate system notifications
 * (notification payload + onBackgroundMessage both showing).
 */
export async function sendWebPushMulticast(
  tokens: string[],
  notification: { title: string; body: string },
  data: Record<string, string>,
): Promise<PushDeliveryResult | null> {
  if (!isFcmConfigured() || tokens.length === 0) return null;
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    logPush("warn", "Firebase Messaging unavailable");
    return null;
  }

  const payloadData = stringifyPushData({
    ...data,
    title: notification.title,
    body: notification.body,
  });

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      data: payloadData,
      webpush: {
        headers: { Urgency: "high" },
      },
    });
    const invalidTokens = invalidTokensFromBatch(tokens, response);
    if (invalidTokens.length > 0) {
      await deleteInvalidPushTokens(invalidTokens);
    }
    logPush("info", "multicast delivered", {
      success: response.successCount,
      failure: response.failureCount,
      invalid: invalidTokens.length,
      event: data.event,
    });
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code && FCM_INVALID_TOKEN_CODES.has(code)) {
      await deleteInvalidPushTokens(tokens);
    }
    logPush("error", "multicast failed", {
      message: err instanceof Error ? err.message : String(err),
      code: code || undefined,
    });
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: code && FCM_INVALID_TOKEN_CODES.has(code) ? tokens : [],
    };
  }
}

/** Cap device rows and drop stale tokens for a user. */
export async function maintainPushTokensForUser(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - PUSH_TOKEN_STALE_MS);
  const stale = await prisma.pushDeviceToken.deleteMany({
    where: { userId, lastUsedAt: { lt: cutoff } },
  });
  if (stale.count > 0) {
    logPush("info", "removed stale tokens", { userId, count: stale.count });
  }

  const rows = await prisma.pushDeviceToken.findMany({
    where: { userId },
    orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  if (rows.length <= MAX_PUSH_TOKENS_PER_USER) return;
  const excess = rows.slice(MAX_PUSH_TOKENS_PER_USER).map((r) => r.id);
  await prisma.pushDeviceToken.deleteMany({ where: { id: { in: excess } } });
  logPush("info", "trimmed excess tokens", { userId, removed: excess.length });
}

export { logPush };
