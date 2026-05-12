import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { resolveAuthenticatedAppGuard } from "../lib/authSession";
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
  const { user, authHydrated } = useAuth();
  const location = useLocation();

  if (!authHydrated) {
    return <AppLoader />;
  }

  if (!user) {
    authDebug("route_guard", {
      decision: "redirect",
      to: "/login",
      reason: "not_authenticated",
      path: location.pathname,
      scope: "RoleProtectedRoute",
    });
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
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
