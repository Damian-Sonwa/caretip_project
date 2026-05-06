import { useState } from "react";
import { Outlet } from "react-router";
import { BusinessSidebar } from "../components/business/BusinessSidebar";
import { BusinessMobileSidebar } from "../components/business/BusinessMobileSidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { isWalkthroughDemoManager } from "../lib/walkthroughDemo";

/**
 * Approved business manager shell: admin-style sidebar + top bar + footer.
 * Child routes render page content only (no duplicate shells).
 */
export function BusinessLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const showDemoRibbon = isWalkthroughDemoManager(user);

  return (
    <div className="relative min-h-screen bg-background">
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
        <BusinessSidebar />
        <BusinessMobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="caretip-dashboard-shell min-h-screen min-w-0 overflow-x-hidden bg-background lg:pl-64">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <Outlet />
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
