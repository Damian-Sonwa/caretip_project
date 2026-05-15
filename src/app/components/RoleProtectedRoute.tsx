import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { getLoginPathForAllowedRoles, resolveAuthenticatedAppGuard } from "../lib/authSession";
import { hasClientStoredSession } from "../lib/authUserStore";
import { isClientSessionRevoked } from "../lib/api";
import { authDebug } from "../lib/authDebugLog";
import { AppLoader } from "./AppLoader";

interface RoleProtectedRouteProps {
  allowedRoles: Array<"business" | "employee">;
  children: ReactNode;
}

/**
 * Same guard as {@link ProtectedRoute} (single resolver). Waits on `authHydrated` so guards
 * do not redirect before the initial session refresh (or no-token path) completes.
 */
export function RoleProtectedRoute({ allowedRoles, children }: RoleProtectedRouteProps) {
  const { user, authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === "initializing") {
    return <AppLoader />;
  }

  if (!user) {
    const loginPath = getLoginPathForAllowedRoles(allowedRoles);
    if (!isClientSessionRevoked() && hasClientStoredSession()) {
      return <AppLoader />;
    }
    authDebug("route_guard", {
      decision: "redirect",
      to: loginPath,
      reason: "not_authenticated",
      path: location.pathname,
      scope: "RoleProtectedRoute",
    });
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  const decision = resolveAuthenticatedAppGuard(user, location.pathname, allowedRoles);

  if (decision.kind === "redirect") {
    authDebug("route_guard", {
      decision: "redirect",
      to: decision.to,
      reason: decision.reason,
      path: location.pathname,
      scope: "RoleProtectedRoute",
    });
    return <Navigate to={decision.to} replace state={{ from: location.pathname }} />;
  }

  authDebug("route_guard", { decision: "allow", path: location.pathname, scope: "RoleProtectedRoute" });
  return <>{children}</>;
}
