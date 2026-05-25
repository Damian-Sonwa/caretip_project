import { useAuth } from "../hooks/useAuth";
import { useFcmPushSync } from "../hooks/useFcmPushSync";

/** Headless FCM registration — respects server-side notification preferences. */
export function PushNotificationSync() {
  const { user, authStatus, authHydrated, sessionValidated } = useAuth();
  useFcmPushSync(user, authStatus, authHydrated && sessionValidated);
  return null;
}
