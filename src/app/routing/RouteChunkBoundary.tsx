import { Suspense, type ReactNode } from "react";
import {
  DashboardOutletFallback,
  DashboardOutletShellHold,
  MinimalRouteFallback,
} from "./DashboardOutletFallback";

type RouteChunkBoundaryProps = {
  children: ReactNode;
  /**
   * shell = dashboard layout outlet (height hold only; page owns skeletons)
   * dashboard = full metric skeleton (standalone / non-shell routes)
   * minimal = public route transition
   */
  variant?: "shell" | "dashboard" | "minimal";
};

export function RouteChunkBoundary({ children, variant = "dashboard" }: RouteChunkBoundaryProps) {
  const fallback =
    variant === "minimal" ? (
      <MinimalRouteFallback />
    ) : variant === "shell" ? (
      <DashboardOutletShellHold />
    ) : (
      <DashboardOutletFallback />
    );
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
