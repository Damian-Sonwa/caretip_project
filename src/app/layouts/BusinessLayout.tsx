import { Outlet } from "react-router";
import { BusinessShellBar } from "../components/business/BusinessShellBar";
import { useAuth } from "../hooks/useAuth";
import { isWalkthroughDemoManager } from "../lib/walkthroughDemo";

/**
 * Business manager shell: shared venue header (logo + name) for all manager routes.
 */
export function BusinessLayout() {
  const { user } = useAuth();
  const showDemoRibbon = isWalkthroughDemoManager(user);

  return (
    <div className="min-h-screen bg-background">
      {showDemoRibbon ? (
        <div
          className="border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 max-[380px]:px-2 sm:text-xs dark:text-amber-100"
          role="status"
        >
          Walkthrough demo: sample venue, staff, tables, and tips are for product tours only and do not affect other
          accounts.
        </div>
      ) : null}
      <BusinessShellBar />
      <Outlet />
    </div>
  );
}
