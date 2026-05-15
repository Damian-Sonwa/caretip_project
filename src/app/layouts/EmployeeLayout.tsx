import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { SidebarSkeleton } from "../components/ui/sidebar-skeleton";
import { EmployeeSidebar } from "../components/employee/EmployeeSidebar";
import { EmployeeMobileSidebar } from "../components/employee/EmployeeMobileSidebar";
import { getEmployeeProfile, getTipsByEmployee } from "../lib/api";
import { syncEmployeeNotificationTips } from "../lib/employeeNotificationStore";

type EmployeeBusinessBranding = {
  businessLogo: string | null;
  businessName: string;
};

/**
 * Staff shell: child routes render each employee page.
 */
export function EmployeeLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, authHydrated, sessionValidated } = useAuth();
  const isAppReady = authHydrated && sessionValidated && user?.role === "employee";
  const [branding, setBranding] = useState<EmployeeBusinessBranding | null>(null);

  useEffect(() => {
    if (!isAppReady) return;
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
  }, [isAppReady]);

  useEffect(() => {
    if (!user?.employeeId || user.role !== "employee") return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await getTipsByEmployee();
        if (!cancelled) syncEmployeeNotificationTips(user.employeeId!, data.tips ?? []);
      } catch {
        // Header badge stays hidden until tips load elsewhere
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.employeeId, user?.role]);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10">
        {isAppReady ? (
          <EmployeeSidebar businessBranding={branding} />
        ) : (
          <SidebarSkeleton />
        )}
        <EmployeeMobileSidebar
          isOpen={mobileMenuOpen && isAppReady}
          onClose={() => setMobileMenuOpen(false)}
          businessBranding={branding}
        />

        <div className="caretip-dashboard-shell flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background lg:pl-64">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1 pb-8">
            <Outlet />
          </main>
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
