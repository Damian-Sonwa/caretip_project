import { useEffect, useState } from "react";
import { useMobileMenuState } from "../hooks/useMobileMenuState";
import { Outlet } from "react-router";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { SidebarSkeleton } from "../components/ui/sidebar-skeleton";
import { EmployeeSidebar } from "../components/employee/EmployeeSidebar";
import { EmployeeMobileSidebar } from "../components/employee/EmployeeMobileSidebar";
import { getEmployeeProfile } from "../lib/api";
import { EMPLOYEE_DASHBOARD_ROOT } from "../components/employee/employeeDashboardUi";
import { cn } from "@/lib/utils";
import { PushNotificationSync } from "../components/PushNotificationSync";
import { RouteChunkBoundary } from "../routing/RouteChunkBoundary";
import { useRegisterPagePaintReady } from "../lib/globalAppLoading";

type EmployeeBusinessBranding = {
  businessLogo: string | null;
  businessName: string;
};

/**
 * Staff shell: child routes render each employee page.
 */
export function EmployeeLayout() {
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const { user, authStatus } = useAuth();
  const isAppReady = authStatus === "authenticated" && user?.role === "employee";
  const [branding, setBranding] = useState<EmployeeBusinessBranding | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || user?.role !== "employee") return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await getEmployeeProfile();
        if (cancelled) return;
        setBranding({
          businessLogo: p.businessLogo ?? null,
          businessName: p.businessName ?? "Business",
        });
      } catch {
        if (cancelled) return;
        setBranding(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, user?.role]);

  useRegisterPagePaintReady("employee-layout-paint");

  return (
    <div className="relative min-h-screen bg-background">
      <PushNotificationSync />
      <div className="relative z-10">
        {isAppReady ? (
          <EmployeeSidebar businessBranding={branding} />
        ) : (
          <SidebarSkeleton />
        )}
        <EmployeeMobileSidebar
          isOpen={mobileMenuOpen}
          onClose={closeMobileMenu}
          businessBranding={branding}
        />

        <div
          className={cn(
            "caretip-dashboard-shell font-sans flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-stone-50/40 lg:pl-64",
            EMPLOYEE_DASHBOARD_ROOT,
          )}
        >
          <DashboardHeader onMenuClick={openMobileMenu} />
          <main className="min-w-0 flex-1 overflow-x-clip">
            <RouteChunkBoundary variant="shell" registrationKey="employee-outlet">
              <Outlet />
            </RouteChunkBoundary>
          </main>
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
