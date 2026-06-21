import { useEffect, useRef } from "react";
import { useLocation, useNavigation } from "react-router";
import { navFlashLog } from "../lib/navigationFlashAudit";

/**
 * Logs route entry and settled render for multi-hop navigation debugging.
 * Dev / `caretip_nav_flash_debug=1` only (see navigationFlashAudit.ts).
 */
export function useNavigationFlashProbe() {
  const location = useLocation();
  const navigation = useNavigation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;
    navFlashLog("route_entered", { path, state: navigation.state });
  }, [location.pathname, location.search, navigation.state]);

  useEffect(() => {
    if (navigation.state !== "idle") return;
    const path = `${location.pathname}${location.search}`;
    navFlashLog("final_route_rendered", { path });
  }, [location.pathname, location.search, navigation.state]);
}
