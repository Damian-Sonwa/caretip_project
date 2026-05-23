import { existsSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

let initAttempted = false;

function credentialsPathConfigured(): boolean {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!path) return false;
  const resolved =
    path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path)
      ? resolve(path)
      : resolve(process.cwd(), path);
  if (!existsSync(resolved)) {
    console.warn("[fcm] GOOGLE_APPLICATION_CREDENTIALS file not found:", resolved);
    return false;
  }
  return true;
}

export function isFcmConfigured(): boolean {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    if (inline.length <= 2 || !inline.startsWith("{")) {
      console.warn(
        "[fcm] FIREBASE_SERVICE_ACCOUNT_JSON appears invalid; use GOOGLE_APPLICATION_CREDENTIALS with a JSON file",
      );
    } else if (inline.length > 32) {
      return true;
    }
  }
  return credentialsPathConfigured();
}

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    console.error("[fcm] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (!isFcmConfigured()) return null;
  if (admin.apps.length > 0) {
    return admin.app();
  }
  if (initAttempted) return null;
  initAttempted = true;
  try {
    const serviceAccount = parseServiceAccount();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    return admin.app();
  } catch (err) {
    console.error("[fcm] Firebase Admin init failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseAdmin();
  if (!app) return null;
  try {
    return admin.messaging(app);
  } catch {
    return null;
  }
}
