import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../hooks/useAuth";
import { CareTipPageLoader } from "./CareTipPageLoader";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"business" | "employee">;
  children: ReactNode;
}) {
  const { user, isLoadingUser } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return <CareTipPageLoader variant="wait" message="Setting things up for you..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const r = user.role as UserRole;

  if (user.isVerified === false && (r === "business" || r === "employee")) {
    return <Navigate to="/verify-email" replace state={{ from: location.pathname }} />;
  }

  if (r === "business" && user.hasCompletedOnboarding === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  if (r === "business" && user.hasCompletedOnboarding === true && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles.includes(r as "business" | "employee")) {
    return <>{children}</>;
  }

  if (r === "platform_admin" || r === "admin") {
    return <Navigate to="/platform-admin/dashboard" replace />;
  }
  if (r === "business") {
    return <Navigate to="/dashboard" replace />;
  }
  if (r === "employee") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

