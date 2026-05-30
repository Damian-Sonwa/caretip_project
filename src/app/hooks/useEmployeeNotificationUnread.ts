import { useCallback, useSyncExternalStore } from "react";
import { getEmployeeUnreadCount, subscribeEmployeeNotifications } from "../lib/employeeNotificationStore";

/** Local unread tip count — no API (employee notification store). */
export function useEmployeeNotificationUnread(employeeId: string | undefined): number | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeEmployeeNotifications(onStoreChange),
    [],
  );
  const getSnapshot = useCallback(() => {
    if (!employeeId) return null;
    return getEmployeeUnreadCount();
  }, [employeeId]);
  const getServerSnapshot = useCallback(() => null as number | null, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
