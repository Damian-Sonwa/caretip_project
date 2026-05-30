import { useState } from "react";
import { Outlet } from "react-router";
import { BusinessSidebar } from "../components/business/BusinessSidebar";
import { BusinessMobileSidebar } from "../components/business/BusinessMobileSidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { isWalkthroughDemoManager } from "../lib/walkthroughDemo";
import { SidebarSkeleton } from "../components/ui/sidebar-skeleton";
import { BUSINESS_DASHBOARD_ROOT } from "../components/business/businessDashboardUi";
import { cn } from "@/lib/utils";
import { PushNotificationSync } from "../components/PushNotificationSync";
import { RouteChunkBoundary } from "../routing/RouteChunkBoundary";

/**
 * Approved business manager shell: admin-style sidebar + top bar + footer.
 * Child routes render page content only (no duplicate shells).
 */
export function BusinessLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, authStatus } = useAuth();
  const showDemoRibbon = isWalkthroughDemoManager(user);
  const isAppReady = authStatus === "authenticated" && user?.role === "business";

  return (
    <div className="relative min-h-screen bg-background">
      <PushNotificationSync />
      {showDemoRibbon ? (
        <div
          className="relative z-20 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 max-[380px]:px-2 sm:text-xs dark:text-amber-100"
          role="status"
        >
          Walkthrough demo: sample venue, staff, tables, and tips are for product tours only and do not affect other
          accounts.
        </div>
      ) : null}
      <div className="relative z-10">
        {isAppReady ? <BusinessSidebar /> : <SidebarSkeleton />}
        <BusinessMobileSidebar isOpen={mobileMenuOpen && isAppReady} onClose={() => setMobileMenuOpen(false)} />
        <div
          className={cn(
            "caretip-dashboard-shell font-sans flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-stone-50/40 lg:pl-64",
            BUSINESS_DASHBOARD_ROOT,
          )}
        >
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1">
            <RouteChunkBoundary variant="shell">
              <Outlet />
            </RouteChunkBoundary>
          </main>
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
