import { useAuth } from "../hooks/useAuth";
import { useFcmPushSync } from "../hooks/useFcmPushSync";

/** Headless FCM registration — respects server-side notification preferences. */
export function PushNotificationSync() {
  const { user, authStatus } = useAuth();
  useFcmPushSync(user, authStatus);
  return null;
}
