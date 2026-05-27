import { Suspense, type ReactNode } from "react";
import { DashboardOutletFallback, MinimalRouteFallback } from "./DashboardOutletFallback";

type RouteChunkBoundaryProps = {
  children: ReactNode;
  /** dashboard = in-layout content skeleton; minimal = lightweight public transition */
  variant?: "dashboard" | "minimal";
};

export function RouteChunkBoundary({ children, variant = "dashboard" }: RouteChunkBoundaryProps) {
  const fallback = variant === "minimal" ? <MinimalRouteFallback /> : <DashboardOutletFallback />;
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
