import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { isAuthRestorePending } from "../lib/authRestore";
import { hasClientStoredSession } from "../lib/authUserStore";
import { isClientSessionRevoked } from "../lib/api";
import { AppLoader } from "./AppLoader";

interface PlatformAdminRouteProps {
  children: ReactNode;
}

/** Requires an authenticated platform admin (SuperAdmin). */
export function PlatformAdminRoute({ children }: PlatformAdminRouteProps) {
  const { user, authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === "initializing" || isAuthRestorePending()) {
    return <AppLoader />;
  }

  if (!user) {
    if (!isClientSessionRevoked() && hasClientStoredSession()) {
      return <AppLoader />;
    }
    return <Navigate to="/platform-admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "platform_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
