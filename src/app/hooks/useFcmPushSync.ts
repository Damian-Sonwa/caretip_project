import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { AuthStatus } from "../lib/authSession";
import type { User } from "./useAuth";
import {
  isWebPushSupported,
  registerFcmDeviceToken,
  subscribeForegroundPushMessages,
  unregisterFcmDeviceToken,
} from "../lib/fcmPush";
import { getMyAccountSettings } from "../lib/api";
import { getEmployeeProfile } from "../lib/api";
import { logClientError } from "../lib/clientLog";

function managerWantsPush(prefs: {
  tipReceivedNotifications: boolean;
  systemAlerts: boolean;
  notifyNewLogin: boolean;
}): boolean {
  return (
    prefs.tipReceivedNotifications || prefs.systemAlerts || prefs.notifyNewLogin
  );
}

/**
 * Syncs FCM registration with stored notification preferences (no UI).
 */
export function useFcmPushSync(user: User | null, authStatus: AuthStatus): void {
  const syncedRef = useRef(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !user) {
      syncedRef.current = false;
      return;
    }
    if (!isWebPushSupported()) return;

    const role = user.role;
    if (role !== "employee" && role !== "business") return;

    let cancelled = false;

    const run = async () => {
      try {
        let wantsPush = false;
        if (role === "employee") {
          const profile = await getEmployeeProfile();
          wantsPush = profile.pushNotifications !== false;
        } else {
          const settings = await getMyAccountSettings();
          wantsPush = managerWantsPush(settings);
        }
        if (cancelled) return;

        if (!wantsPush) {
          await unregisterFcmDeviceToken();
          syncedRef.current = true;
          return;
        }

        if (Notification.permission === "denied") {
          syncedRef.current = true;
          return;
        }

        await registerFcmDeviceToken();
        syncedRef.current = true;
      } catch (err) {
        logClientError("useFcmPushSync", err);
      }
    };

    if (!syncedRef.current) {
      void run();
    }

    return () => {
      cancelled = true;
    };
  }, [authStatus, user?.id, user?.role]);

  useEffect(() => {
    if (authStatus !== "authenticated") return undefined;
    return subscribeForegroundPushMessages((title, body) => {
      toast(title, { description: body || undefined });
    });
  }, [authStatus, user?.id]);

  /** Re-register FCM token after refresh or when returning to the tab (production token rotation). */
  useEffect(() => {
    if (authStatus !== "authenticated" || !user) return undefined;
    if (!isWebPushSupported() || Notification.permission !== "granted") return undefined;
    if (user.role !== "employee" && user.role !== "business") return undefined;

    const refreshToken = () => {
      if (document.visibilityState !== "visible") return;
      void registerFcmDeviceToken().catch((err) => logClientError("useFcmPushSync.refreshToken", err));
    };

    document.addEventListener("visibilitychange", refreshToken);
    return () => document.removeEventListener("visibilitychange", refreshToken);
  }, [authStatus, user?.id, user?.role]);
}
