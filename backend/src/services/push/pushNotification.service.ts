import { prisma } from "../../prisma.js";
import { isFcmConfigured } from "./fcmAdmin.js";
import type { NewTipPayload } from "../../socket/emitTip.js";
import {
  logPush,
  maintainPushTokensForUser,
  sendWebPushMulticast,
  stringifyPushData,
} from "./pushSend.js";

export type PushEventType = "tip_received" | "payout_paid" | "new_login" | "system_alert";

function truncateUserAgent(ua: string | undefined): string | null {
  if (!ua) return null;
  const t = ua.trim();
  if (!t) return null;
  return t.length > 512 ? t.slice(0, 512) : t;
}

function envFirst(...keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return "";
}

export function getPublicFirebaseWebConfig(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
} | null {
  const apiKey = envFirst("FIREBASE_WEB_API_KEY", "VITE_FIREBASE_API_KEY");
  const projectId = envFirst("FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID");
  const messagingSenderId = envFirst(
    "FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
  );
  const appId = envFirst("FIREBASE_WEB_APP_ID", "VITE_FIREBASE_APP_ID");
  const vapidKey = envFirst("FIREBASE_WEB_VAPID_KEY", "VITE_FIREBASE_VAPID_KEY");
  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return null;
  }
  const authDomain =
    envFirst("FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN") ||
    `${projectId}.firebaseapp.com`;
  const storageBucket =
    envFirst("FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET") ||
    `${projectId}.appspot.com`;
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    vapidKey,
  };
}

export async function registerPushDeviceToken(
  userId: string,
  token: string,
  userAgent?: string,
): Promise<void> {
  const trimmed = token.trim();
  if (trimmed.length < 80 || trimmed.length > 4096) {
    throw new Error("Invalid push token");
  }
  const ua = truncateUserAgent(userAgent);
  await prisma.pushDeviceToken.upsert({
    where: { token: trimmed },
    create: {
      userId,
      token: trimmed,
      platform: "web",
      userAgent: ua,
    },
    update: {
      userId,
      userAgent: ua,
      lastUsedAt: new Date(),
    },
  });
  await maintainPushTokensForUser(userId);
}

export async function removePushDeviceToken(userId: string, token: string): Promise<void> {
  const trimmed = token.trim();
  await prisma.pushDeviceToken.deleteMany({
    where: { userId, token: trimmed },
  });
}

export async function removeAllPushDeviceTokensForUser(userId: string): Promise<void> {
  await prisma.pushDeviceToken.deleteMany({ where: { userId } });
}

async function userWantsPush(userId: string, event: PushEventType): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      role: true,
      settings: {
        select: {
          tipReceivedNotifications: true,
          systemAlerts: true,
          notifyNewLogin: true,
        },
      },
      employee: { select: { pushNotifications: true } },
    },
  });
  if (!user?.isActive) return false;

  const settings = user.settings;
  const employeePush = user.employee?.pushNotifications ?? true;

  switch (event) {
    case "tip_received":
      if (user.role === "EMPLOYEE") return employeePush;
      if (user.role === "MANAGER") return settings?.tipReceivedNotifications ?? true;
      return false;
    case "payout_paid":
      if (user.role === "EMPLOYEE") return employeePush;
      if (user.role === "MANAGER") return settings?.systemAlerts ?? true;
      return false;
    case "new_login":
      if (user.role === "EMPLOYEE") {
        return (settings?.notifyNewLogin ?? true) && employeePush;
      }
      return settings?.notifyNewLogin ?? true;
    case "system_alert":
      if (user.role === "EMPLOYEE") return employeePush;
      return settings?.systemAlerts ?? true;
    default:
      return false;
  }
}

async function listTokensForUser(userId: string): Promise<string[]> {
  const rows = await prisma.pushDeviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}

function deepLinkForEvent(event: PushEventType, data?: Record<string, string>): string {
  switch (event) {
    case "tip_received":
      return "/employee/dashboard";
    case "payout_paid":
      return "/employee/dashboard";
    case "new_login":
      return "/employee/settings";
    case "system_alert":
      return data?.type === "test" ? "/dashboard/settings" : "/dashboard";
    default:
      return "/";
  }
}

async function sendPushToUser(
  userId: string,
  event: PushEventType,
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> {
  if (!isFcmConfigured()) return;

  const allowed = await userWantsPush(userId, event);
  if (!allowed) {
    logPush("info", "skipped (preferences)", { userId, event });
    return;
  }

  const tokens = await listTokensForUser(userId);
  if (tokens.length === 0) return;

  const payload = stringifyPushData({
    event,
    url: data?.url ?? deepLinkForEvent(event, data),
    ...data,
  });

  const result = await sendWebPushMulticast(tokens, notification, payload);
  if (!result) return;

  const stillValid = tokens.filter((t) => !result.invalidTokens.includes(t));
  if (stillValid.length > 0) {
    await prisma.pushDeviceToken.updateMany({
      where: { userId, token: { in: stillValid } },
      data: { lastUsedAt: new Date() },
    });
  }

  if (result.successCount === 0 && result.failureCount > 0) {
    logPush("warn", "no devices accepted message", { userId, event });
  }
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

/** After a successful tip (socket + optional push). */
export async function notifyTipReceivedPush(payload: NewTipPayload): Promise<void> {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
      select: { userId: true, name: true },
    });
    if (!employee) return;

    const amountLabel = formatEur(payload.tip.amount);
    const title = "New tip received";
    const body = `${amountLabel} — ${employee.name}`;

    await sendPushToUser(employee.userId, "tip_received", { title, body }, {
      tipId: payload.tip.id,
      employeeId: payload.employeeId,
      businessId: payload.businessId,
      url: "/employee/dashboard",
    });

    const business = await prisma.business.findUnique({
      where: { id: payload.businessId },
      select: { userId: true },
    });
    if (business?.userId && business.userId !== employee.userId) {
      await sendPushToUser(business.userId, "tip_received", {
        title: "New tip at your venue",
        body: `${amountLabel} for ${employee.name}`,
      }, {
        tipId: payload.tip.id,
        employeeId: payload.employeeId,
        businessId: payload.businessId,
        url: "/dashboard",
      });
    }
  } catch (err) {
    logPush("error", "notifyTipReceivedPush failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Security alert (respects notify_new_login; no IP in push body). */
export async function notifyNewLoginPush(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const settingsUrl =
      user?.role === "MANAGER" ? "/dashboard/settings" : "/employee/settings";
    await sendPushToUser(
      userId,
      "new_login",
      {
        title: "New sign-in",
        body: "Your CareTip account was used to sign in. If this wasn't you, change your password.",
      },
      { type: "new_login", url: settingsUrl },
    );
  } catch (err) {
    logPush("error", "notifyNewLoginPush failed", {
      userId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function notifyPayoutPaidPush(
  userId: string,
  amount: number,
  transactionId: string,
): Promise<void> {
  try {
    await sendPushToUser(
      userId,
      "payout_paid",
      {
        title: "Payout completed",
        body: `A payout of ${formatEur(amount)} was processed.`,
      },
      { transactionId, payoutStatus: "paid" },
    );
  } catch (err) {
    logPush("error", "notifyPayoutPaidPush failed", {
      userId,
      transactionId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Call when a transaction's payoutStatus becomes `paid` (Stripe/admin payout flow).
 */
export async function notifyPayoutPaidForTransaction(transactionId: string): Promise<void> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      payoutStatus: true,
      amount: true,
      employee: { select: { userId: true } },
    },
  });
  if (!tx || tx.payoutStatus !== "paid" || !tx.employee?.userId) return;
  await notifyPayoutPaidPush(tx.employee.userId, Number(tx.amount), transactionId);
}

/** Generic system message (respects system_alerts / employee push toggle). */
export async function notifySystemAlertPush(
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await sendPushToUser(userId, "system_alert", { title, body }, { type: "system_alert" });
  } catch (err) {
    logPush("error", "notifySystemAlertPush failed", {
      userId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export type SendTestPushResult = {
  sent: boolean;
  successCount: number;
  failureCount: number;
  tokenCount: number;
  message: string;
};

/** Sends a test notification to all tokens for the user (ignores preference toggles). */
export async function sendTestPushToUser(userId: string): Promise<SendTestPushResult> {
  const tokens = await listTokensForUser(userId);
  if (tokens.length === 0) {
    return {
      sent: false,
      successCount: 0,
      failureCount: 0,
      tokenCount: 0,
      message: "No device tokens registered. Enable push and allow browser notifications first.",
    };
  }
  if (!isFcmConfigured()) {
    return {
      sent: false,
      successCount: 0,
      failureCount: 0,
      tokenCount: tokens.length,
      message: "FCM is not configured on the server (FIREBASE_SERVICE_ACCOUNT_JSON).",
    };
  }

  const notification = {
    title: "CareTip test",
    body: "Push notifications are working.",
  };

  const result = await sendWebPushMulticast(tokens, notification, {
    event: "system_alert",
    type: "test",
    url: "/dashboard/settings",
  });

  if (!result) {
    return {
      sent: false,
      successCount: 0,
      failureCount: tokens.length,
      tokenCount: tokens.length,
      message: "Firebase Admin failed to initialize.",
    };
  }

  const stillValid = tokens.filter((t) => !result.invalidTokens.includes(t));
  if (stillValid.length > 0) {
    await prisma.pushDeviceToken.updateMany({
      where: { userId, token: { in: stillValid } },
      data: { lastUsedAt: new Date() },
    });
  }

  const sent = result.successCount > 0;
  return {
    sent,
    successCount: result.successCount,
    failureCount: result.failureCount,
    tokenCount: tokens.length,
    message: sent
      ? `Test notification sent to ${result.successCount} device(s).`
      : "Failed to deliver to any registered device.",
  };
}
