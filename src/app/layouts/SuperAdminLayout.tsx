import { useState } from "react";
import { Outlet } from "react-router";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminMobileSidebar } from "../components/AdminMobileSidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { Footer } from "../components/Footer";
/**
 * Platform / Super Admin shell only: sidebar, platform header, footer.
 * Child routes render page content (no shared "Dashboard" with business).
 */
export function SuperAdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10">
        <AdminSidebar />
        <AdminMobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="min-h-screen min-w-0 overflow-x-hidden bg-background lg:pl-64">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <Outlet />
          <Footer variant="minimal" />
        </div>
      </div>
    </div>
  );
}
