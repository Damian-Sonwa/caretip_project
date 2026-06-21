import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { isClientSessionRevoked } from "../lib/api";
import { authDebug } from "../lib/authDebugLog";
import { navFlashLog } from "../lib/navigationFlashAudit";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import { useProtectedRouteGate } from "../hooks/useProtectedRouteGate";
import { AppRouteGateShell } from "./AppRouteGateShell";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"business" | "employee">;
  children: ReactNode;
}) {
  const gate = useProtectedRouteGate(allowedRoles);
  const rolesKey = allowedRoles.join(",");
  const sessionBlocking = gate.authBlocking || gate.storedSessionSync;

  useAppLoadingRegistration(
    `protected-route-session:${rolesKey}`,
    APP_LOADING_PRIORITY.AUTH,
    sessionBlocking,
  );
  useAppLoadingRegistration(
    `protected-route-guard:${rolesKey}:${gate.pathname}`,
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    gate.guardBlocking,
  );

  if (gate.blocking) {
    if (gate.guardBlocking) {
      authDebug("route_guard", {
        decision: "loading",
        reason: gate.decision?.kind === "wait" ? gate.decision.reason : "pending",
        path: gate.pathname,
      });
      navFlashLog("guard_started", {
        path: gate.pathname,
        guard: "ProtectedRoute",
        reason: gate.decision?.kind === "wait" ? gate.decision.reason : "auth_pending",
      });
    }
    return <AppRouteGateShell />;
  }

  if (!gate.user) {
    if (!isClientSessionRevoked() && gate.storedSessionSync) {
      navFlashLog("guard_started", { path: gate.pathname, guard: "ProtectedRoute", reason: "stored_session_sync" });
      return <AppRouteGateShell />;
    }
    authDebug("route_guard", {
      decision: "redirect",
      to: gate.loginPath,
      reason: "not_authenticated",
      path: gate.pathname,
    });
    navFlashLog("redirect_scheduled", {
      path: gate.pathname,
      to: gate.loginPath,
      guard: "ProtectedRoute",
      reason: "not_authenticated",
    });
    return <Navigate to={gate.loginPath} replace state={{ from: gate.pathname }} />;
  }

  if (gate.decision?.kind === "redirect") {
    authDebug("route_guard", {
      decision: "redirect",
      to: gate.decision.to,
      reason: gate.decision.reason,
      path: gate.pathname,
    });
    navFlashLog("redirect_scheduled", {
      path: gate.pathname,
      to: gate.decision.to,
      guard: "ProtectedRoute",
      reason: gate.decision.reason,
    });
    return <Navigate to={gate.decision.to} replace state={{ from: gate.pathname }} />;
  }

  authDebug("route_guard", { decision: "allow", path: gate.pathname });
  navFlashLog("guard_resolved", { path: gate.pathname, guard: "ProtectedRoute", decision: "allow" });
  return <>{children}</>;
}
