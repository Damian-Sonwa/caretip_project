import { Outlet } from "react-router";

/**
 * Business manager shell: no platform sidebar/header. Child routes own their UI
 * (e.g. BusinessDashboard navigation is internal to those pages).
 */
export function BusinessLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
