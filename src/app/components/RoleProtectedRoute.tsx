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
 * Same guard as {@link ProtectedRoute} (single resolver). Uses the global auth loading flag
 * so session is not double-fetched here.
 */
export function RoleProtectedRoute({ allowedRoles, children }: RoleProtectedRouteProps) {
  const { user, isLoadingUser } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return <AppLoader message="Setting things up for you..." />;
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
