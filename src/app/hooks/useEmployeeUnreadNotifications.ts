import { useReducer, useEffect } from "react";
import {
  getEmployeeUnreadCount,
  subscribeEmployeeNotifications,
} from "../lib/employeeNotificationStore";

/** Live unread tip-notification count for the employee shell header badge. */
export function useEmployeeUnreadCount(): number {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeEmployeeNotifications(() => bump()), []);

  return getEmployeeUnreadCount();
}
