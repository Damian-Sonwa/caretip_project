import { prisma } from "../../prisma.js";
import { getFirebaseMessaging, isFcmConfigured } from "./fcmAdmin.js";
import type { NewTipPayload } from "../../socket/emitTip.js";

export type PushEventType = "tip_received" | "payout_paid" | "new_login" | "system_alert";

const FCM_INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

function truncateUserAgent(ua: string | undefined): string | null {
  if (!ua) return null;
  const t = ua.trim();
  if (!t) return null;
  return t.length > 512 ? t.slice(0, 512) : t;
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
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.FIREBASE_WEB_APP_ID?.trim();
  const vapidKey = process.env.FIREBASE_WEB_VAPID_KEY?.trim();
  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return null;
  }
  const authDomain =
    process.env.FIREBASE_AUTH_DOMAIN?.trim() || `${projectId}.firebaseapp.com`;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`;
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

async function pruneInvalidTokens(tokens: string[], error: unknown): Promise<void> {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  if (!FCM_INVALID_TOKEN_CODES.has(code)) return;
  await prisma.pushDeviceToken.deleteMany({
    where: { token: { in: tokens } },
  });
}

async function sendPushToUser(
  userId: string,
  event: PushEventType,
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> {
  if (!isFcmConfigured()) return;
  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  const allowed = await userWantsPush(userId, event);
  if (!allowed) return;

  const tokens = await listTokensForUser(userId);
  if (tokens.length === 0) return;

  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification,
      data: { event, ...data },
      webpush: {
        notification: {
          icon: "/icon-192.png",
        },
      },
    });
    const invalid: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success && r.error?.code && FCM_INVALID_TOKEN_CODES.has(r.error.code)) {
        invalid.push(tokens[i]!);
      }
    });
    if (invalid.length > 0) {
      await prisma.pushDeviceToken.deleteMany({ where: { token: { in: invalid } } });
    }
    await prisma.pushDeviceToken.updateMany({
      where: { userId, token: { in: tokens } },
      data: { lastUsedAt: new Date() },
    });
  } catch (err) {
    await pruneInvalidTokens(tokens, err);
    console.error("[push] send failed:", err instanceof Error ? err.message : err);
  }
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

/** After a successful tip (socket + optional push). */
export async function notifyTipReceivedPush(payload: NewTipPayload): Promise<void> {
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
    });
  }
}

/** Security alert (respects notify_new_login; no IP in push body). */
export async function notifyNewLoginPush(userId: string): Promise<void> {
  await sendPushToUser(
    userId,
    "new_login",
    {
      title: "New sign-in",
      body: "Your CareTip account was used to sign in. If this wasn't you, change your password.",
    },
    { type: "new_login" },
  );
}

/**
 * Call when a transaction payout status becomes `paid` (e.g. future admin/payout API).
 */
export async function notifyPayoutPaidPush(
  userId: string,
  amount: number,
  transactionId: string,
): Promise<void> {
  await sendPushToUser(
    userId,
    "payout_paid",
    {
      title: "Payout completed",
      body: `A payout of ${formatEur(amount)} was processed.`,
    },
    { transactionId, payoutStatus: "paid" },
  );
}

/** Generic system message (respects system_alerts / employee push toggle). */
export async function notifySystemAlertPush(
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  await sendPushToUser(userId, "system_alert", { title, body }, { type: "system_alert" });
}
