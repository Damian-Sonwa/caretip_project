import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { resolveActiveSidebarGroupId } from "../components/business/businessDashboardNav";

/**
 * Option 1 — auto-expand active section: at most one group open; route drives expansion.
 */
export function useBusinessSidebarNavState() {
  const { pathname, search } = useLocation();

  const activeGroupId = useMemo(
    () => resolveActiveSidebarGroupId(pathname, search),
    [pathname, search],
  );

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedGroupId(activeGroupId);
  }, [activeGroupId]);

  const isExpanded = useCallback(
    (groupId: string) => expandedGroupId === groupId,
    [expandedGroupId],
  );

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  }, []);

  return { activeGroupId, isExpanded, toggleGroup };
}
