import { useState } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminMobileSidebar } from "../components/AdminMobileSidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { isWalkthroughDemoPlatformAdmin } from "../lib/walkthroughDemo";
/**
 * Platform / Super Admin shell only: sidebar, platform header, footer.
 * Child routes render page content (no shared "Dashboard" with business).
 */
export function SuperAdminLayout() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const showDemoRibbon = isWalkthroughDemoPlatformAdmin(user);

  return (
    <div className="relative min-h-screen bg-background">
      {showDemoRibbon ? (
        <div
          className="relative z-20 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 max-[380px]:px-2 sm:text-xs dark:text-amber-100"
          role="status"
        >
          {t("admin.shell.demoRibbon")}
        </div>
      ) : null}
      <div className="relative z-10">
        <AdminSidebar />
        <AdminMobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="caretip-dashboard-shell min-h-screen min-w-0 overflow-x-hidden bg-background lg:pl-64">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <Outlet />
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
