import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { AppLoader } from "./AppLoader";

interface PlatformAdminRouteProps {
  children: ReactNode;
}

/** Requires an authenticated platform admin (SuperAdmin). */
export function PlatformAdminRoute({ children }: PlatformAdminRouteProps) {
  const { user, authHydrated, sessionValidated } = useAuth();
  const location = useLocation();

  if (!authHydrated || !sessionValidated) {
    return <AppLoader />;
  }

  if (!user) {
    return <Navigate to="/platform-admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "platform_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
