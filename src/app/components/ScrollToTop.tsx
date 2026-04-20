import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Scrolls to `#hash` targets when present; otherwise scrolls to top on pathname
 * changes so route transitions don't preserve the previous page's scroll.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = hash ? hash.replace(/^#/, "") : "";
    if (id) {
      const scrollToTarget = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return true;
        }
        return false;
      };
      if (scrollToTarget()) return;
      const t = window.setTimeout(() => {
        scrollToTarget();
      }, 50);
      return () => window.clearTimeout(t);
    }
    // Instant reset so route changes land at the top (avoids smooth-scroll fighting `html` styles).
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
}
