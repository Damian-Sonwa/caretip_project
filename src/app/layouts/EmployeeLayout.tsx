import { Outlet } from "react-router";

/**
 * Staff shell: child routes render each employee page.
 */
export function EmployeeLayout() {
  return (
    <div className="caretip-dashboard-shell min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
