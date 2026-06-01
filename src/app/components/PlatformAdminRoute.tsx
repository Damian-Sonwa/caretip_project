import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { isAuthRestorePending } from "../lib/authRestore";
import { hasClientStoredSession } from "../lib/authUserStore";
import { isClientSessionRevoked } from "../lib/api";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import { AppRouteGateShell } from "./AppRouteGateShell";
interface PlatformAdminRouteProps {
  children: ReactNode;
}

/** Requires an authenticated platform admin (SuperAdmin). */
export function PlatformAdminRoute({ children }: PlatformAdminRouteProps) {
  const { user, authStatus } = useAuth();
  const location = useLocation();

  const authBlocking = authStatus === "initializing" || isAuthRestorePending();
  const storedSessionSync =
    !user && !isClientSessionRevoked() && hasClientStoredSession();
  const blocking = authBlocking || storedSessionSync;

  useAppLoadingRegistration(
    `platform-admin-route-session:${location.pathname}`,
    APP_LOADING_PRIORITY.AUTH,
    blocking,
  );

  if (blocking) {
    return <AppRouteGateShell />;
  }

  if (!user) {
    return <Navigate to="/platform-admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "platform_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
