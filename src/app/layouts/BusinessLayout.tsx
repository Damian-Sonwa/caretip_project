import { Outlet } from "react-router";
import { BusinessShellBar } from "../components/business/BusinessShellBar";

/**
 * Business manager shell: shared venue header (logo + name) for all manager routes.
 */
export function BusinessLayout() {
  return (
    <div className="min-h-screen bg-background">
      <BusinessShellBar />
      <Outlet />
    </div>
  );
}
