import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import {
  deleteAllPushDeviceTokensApi,
  deletePushDeviceTokenApi,
  fetchPushFirebaseConfig,
  registerPushDeviceTokenApi,
  type FirebaseWebConfig,
} from "./api";
import { logClientError } from "./clientLog";

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let configCache: FirebaseWebConfig | null | undefined;

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  );
}

async function loadConfig(): Promise<FirebaseWebConfig | null> {
  if (configCache !== undefined) return configCache;
  configCache = await fetchPushFirebaseConfig();
  return configCache;
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    if (import.meta.env.PROD) {
      return await navigator.serviceWorker.ready;
    }
    const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (err) {
    logClientError("fcmPush.serviceWorkerRegistration", err);
    return null;
  }
}

function getMessagingInstance(config: FirebaseWebConfig): Messaging | null {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
  }
  if (!messaging) {
    try {
      messaging = getMessaging(firebaseApp);
    } catch (err) {
      logClientError("fcmPush.getMessaging", err);
      return null;
    }
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isWebPushSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

async function obtainFcmTokenFromBrowser(): Promise<string | null> {
  if (!isWebPushSupported()) return null;
  const config = await loadConfig();
  if (!config) return null;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return null;

  const reg = await serviceWorkerRegistration();
  if (!reg) return null;

  const msg = getMessagingInstance(config);
  if (!msg) return null;

  try {
    return await getToken(msg, {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: reg,
    });
  } catch (err) {
    logClientError("fcmPush.obtainFcmTokenFromBrowser", err);
    return null;
  }
}

/** Returns the current FCM token without persisting it on the server. */
export async function getCurrentFcmDeviceToken(): Promise<string | null> {
  return obtainFcmTokenFromBrowser();
}

export type FcmDiagnostics = {
  supported: boolean;
  permission: NotificationPermission;
  configAvailable: boolean;
  hasToken: boolean;
};

export async function getFcmDiagnostics(): Promise<FcmDiagnostics> {
  const supported = isWebPushSupported();
  const permission = supported ? Notification.permission : "denied";
  const config = supported ? await loadConfig() : null;
  const configAvailable = Boolean(config);
  let hasToken = false;
  if (configAvailable && permission === "granted") {
    const token = await obtainFcmTokenFromBrowser();
    hasToken = Boolean(token);
  }
  return { supported, permission, configAvailable, hasToken };
}

export async function registerFcmDeviceToken(): Promise<boolean> {
  try {
    const token = await obtainFcmTokenFromBrowser();
    if (!token) return false;
    await registerPushDeviceTokenApi(token);
    return true;
  } catch (err) {
    logClientError("fcmPush.registerFcmDeviceToken", err);
    return false;
  }
}

export async function unregisterFcmDeviceToken(): Promise<void> {
  const config = await loadConfig();
  if (config && messaging) {
    try {
      const reg = await serviceWorkerRegistration();
      const msg = getMessagingInstance(config);
      if (msg && reg) {
        const token = await getToken(msg, {
          vapidKey: config.vapidKey,
          serviceWorkerRegistration: reg,
        });
        if (token) {
          await deletePushDeviceTokenApi(token);
        }
      }
    } catch (err) {
      logClientError("fcmPush.unregisterFcmDeviceToken", err);
    }
  }
  try {
    await deleteAllPushDeviceTokensApi();
  } catch (err) {
    logClientError("fcmPush.unregister.all", err);
  }
}

/** Foreground messages — show a simple notification when tab is focused. */
export function subscribeForegroundPushMessages(
  onPayload?: (title: string, body: string) => void,
): () => void {
  let cancelled = false;
  void (async () => {
    const config = await loadConfig();
    if (!config || cancelled) return;
    const msg = getMessagingInstance(config);
    if (!msg || cancelled) return;
    onMessage(msg, (payload) => {
      const title = payload.notification?.title ?? "CareTip";
      const body = payload.notification?.body ?? "";
      if (onPayload) onPayload(title, body);
      else if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon-192.png" });
      }
    });
  })();
  return () => {
    cancelled = true;
  };
}
