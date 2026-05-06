import { useState } from "react";
import { Outlet } from "react-router";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { SidebarSkeleton } from "../components/ui/sidebar-skeleton";
import { EmployeeSidebar } from "../components/employee/EmployeeSidebar";
import { EmployeeMobileSidebar } from "../components/employee/EmployeeMobileSidebar";

/**
 * Staff shell: child routes render each employee page.
 */
export function EmployeeLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, authHydrated, sessionValidated } = useAuth();
  const isAppReady = authHydrated && sessionValidated && user?.role === "employee";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10">
        {isAppReady ? <EmployeeSidebar /> : <SidebarSkeleton />}
        <EmployeeMobileSidebar isOpen={mobileMenuOpen && isAppReady} onClose={() => setMobileMenuOpen(false)} />

        <div className="caretip-dashboard-shell min-h-screen min-w-0 overflow-x-hidden bg-background lg:pl-64">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <Outlet />
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
