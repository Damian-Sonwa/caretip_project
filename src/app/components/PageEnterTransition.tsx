import type { ReactNode } from "react";
import { useLocation } from "react-router";

/**
 * Soft page entrance when route content mounts — structure is immediate; motion is cosmetic.
 */
export function PageEnterTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="caretip-page-enter min-w-0">
      {children}
    </div>
  );
}
