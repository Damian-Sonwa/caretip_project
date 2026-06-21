import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminMobileSidebar } from "../components/AdminMobileSidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { isWalkthroughDemoPlatformAdmin } from "../lib/walkthroughDemo";
import { SidebarSkeleton } from "../components/ui/sidebar-skeleton";
import { PLATFORM_DASHBOARD_ROOT } from "../components/platform/platformDashboardUi";
import { PushNotificationSync } from "../components/PushNotificationSync";
import { RouteChunkBoundary } from "../routing/RouteChunkBoundary";
import { cn } from "@/lib/utils";
import { useRegisterPagePaintReady } from "../lib/globalAppLoading";
import { useMobileMenuState } from "../hooks/useMobileMenuState";
/**
 * Platform / Super Admin shell only: sidebar, platform header, footer.
 * Child routes render page content (no shared "Dashboard" with business).
 */
export function SuperAdminLayout() {
  const { t } = useTranslation();
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const { user, authStatus } = useAuth();
  const showDemoRibbon = isWalkthroughDemoPlatformAdmin(user);
  const isAppReady = authStatus === "authenticated" && user?.role === "platform_admin";

  useRegisterPagePaintReady("platform-admin-layout-paint");

  return (
    <div className="relative min-h-screen bg-background">
      <PushNotificationSync />
      {showDemoRibbon ? (
        <div
          className="relative z-20 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 max-[380px]:px-2 sm:text-xs dark:text-amber-100"
          role="status"
        >
          {t("admin.shell.demoRibbon")}
        </div>
      ) : null}
      <div className="relative z-10">
        {isAppReady ? <AdminSidebar /> : <SidebarSkeleton />}
        <AdminMobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
        <div
          className={cn(
            "caretip-dashboard-shell font-sans flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-stone-50/40 lg:pl-64",
            PLATFORM_DASHBOARD_ROOT,
          )}
        >
          <DashboardHeader onMenuClick={openMobileMenu} />
          <main className="min-w-0 flex-1 overflow-x-clip">
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
