import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { resolveAuthenticatedAppGuard } from "../lib/authSession";
import { authDebug } from "../lib/authDebugLog";
import { AppLoader } from "./AppLoader";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"business" | "employee">;
  children: ReactNode;
}) {
  const { user, authHydrated, sessionValidated } = useAuth();
  const location = useLocation();

  if (!authHydrated || !sessionValidated) return <AppLoader />;

  if (!user) {
    authDebug("route_guard", {
      decision: "redirect",
      to: "/login",
      reason: "not_authenticated",
      path: location.pathname,
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
    });
    return <Navigate to={decision.to} replace state={{ from: location.pathname }} />;
  }

  authDebug("route_guard", { decision: "allow", path: location.pathname });
  return <>{children}</>;
}
