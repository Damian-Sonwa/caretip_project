import { useEffect, useRef } from "react";

/**
 * Refetch live dashboard data when the user returns to the tab (no persistent metric cache).
 */
export function useDashboardTabRefocus(onRefocus: () => void, enabled: boolean) {
  const onRefocusRef = useRef(onRefocus);
  onRefocusRef.current = onRefocus;

  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        onRefocusRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled]);
}
