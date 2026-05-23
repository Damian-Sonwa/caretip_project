import { prisma } from "../../prisma.js";
import { maintainPushTokensForUser } from "./pushSend.js";

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

export async function listPushTokensForUser(userId: string): Promise<string[]> {
  const rows = await prisma.pushDeviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}
