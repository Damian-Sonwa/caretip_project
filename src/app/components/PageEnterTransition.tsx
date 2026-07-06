import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useAppRevealState } from "../context/AppLoadingSplashContext";

/**
 * Route entrance after launch reveal — initial paint stays fully opaque under the loader overlay.
 */
export function PageEnterTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { revealed } = useAppRevealState();
  const [navAnimate, setNavAnimate] = useState(false);
  const revealSeen = useRef(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (!revealed) {
      setNavAnimate(false);
      return;
    }
    if (!revealSeen.current) {
      revealSeen.current = true;
      prevPath.current = location.pathname;
      return;
    }
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    setNavAnimate(true);
    const id = window.setTimeout(() => setNavAnimate(false), 520);
    return () => window.clearTimeout(id);
  }, [location.pathname, revealed]);

  return (
    <div className={cn("min-w-0", navAnimate && "caretip-page-enter")}>{children}</div>
  );
}
