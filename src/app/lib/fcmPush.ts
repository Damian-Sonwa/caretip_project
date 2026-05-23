import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type MessagePayload,
  type Messaging,
} from "firebase/messaging";
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

const FCM_SW_URL = "/firebase-messaging-sw.js";
const FCM_SW_SCOPE = "/";

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

async function waitForServiceWorkerActive(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return;
  const worker = reg.installing ?? reg.waiting;
  if (!worker) return;
  await new Promise<void>((resolve) => {
    if (reg.active) {
      resolve();
      return;
    }
    worker.addEventListener("statechange", () => {
      if (reg.active) resolve();
    });
  });
}

async function resolveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    if (import.meta.env.PROD) {
      const reg = await navigator.serviceWorker.ready;
      await waitForServiceWorkerActive(reg);
      return reg;
    }
    let reg = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE);
    if (!reg) {
      reg = await navigator.serviceWorker.register(FCM_SW_URL, { scope: FCM_SW_SCOPE });
    }
    await waitForServiceWorkerActive(reg);
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    logClientError("fcmPush.serviceWorkerRegistration", err);
    return null;
  }
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!swRegistrationPromise) {
    swRegistrationPromise = resolveServiceWorkerRegistration();
  }
  return swRegistrationPromise;
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

function payloadTitleBody(payload: MessagePayload): { title: string; body: string } {
  const title =
    payload.notification?.title ?? payload.data?.title ?? "CareTip";
  const body = payload.notification?.body ?? payload.data?.body ?? "";
  return { title, body };
}

/** Shows a system notification via the FCM service worker (works in Firefox on localhost). */
export async function showPushNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    return;
  }
  const options: NotificationOptions = {
    body: body || undefined,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data ? { ...data } : {},
    tag: [data?.event, data?.tipId, data?.transactionId, data?.type]
      .filter(Boolean)
      .join("-") || "caretip-notification",
  };
  try {
    const reg = await serviceWorkerRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch (err) {
    logClientError("fcmPush.showPushNotification", err);
    try {
      new Notification(title, { body: body || undefined, icon: "/icon-192.png" });
    } catch (fallbackErr) {
      logClientError("fcmPush.showPushNotification.fallback", fallbackErr);
    }
  }
}

/** Foreground messages — visible system notification + optional in-app callback. */
export function subscribeForegroundPushMessages(
  onPayload?: (title: string, body: string) => void,
): () => void {
  let cancelled = false;
  let unsubscribeOnMessage: (() => void) | null = null;

  void (async () => {
    if (!isWebPushSupported()) return;
    const config = await loadConfig();
    if (!config || cancelled) return;
    const reg = await serviceWorkerRegistration();
    if (!reg || cancelled) return;
    const msg = getMessagingInstance(config);
    if (!msg || cancelled) return;

    unsubscribeOnMessage = onMessage(msg, (payload) => {
      const { title, body } = payloadTitleBody(payload);
      const data = payload.data as Record<string, string> | undefined;
      onPayload?.(title, body);
      void showPushNotification(title, body, data);
    });
  })();

  return () => {
    cancelled = true;
    unsubscribeOnMessage?.();
    unsubscribeOnMessage = null;
  };
}
