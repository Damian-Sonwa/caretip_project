import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { resolvePlatformAdminActiveGroupId } from "../components/platform/platformAdminNav";

export function usePlatformAdminSidebarNavState() {
  const { pathname } = useLocation();

  const activeGroupId = useMemo(() => resolvePlatformAdminActiveGroupId(pathname), [pathname]);

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
