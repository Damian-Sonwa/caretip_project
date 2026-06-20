import { Suspense, useEffect, useState, type ReactNode } from "react";
import { scheduleIdleWork } from "@/lib/publicRouteDefer";

type DashboardChartsIdleMountProps = {
  children: ReactNode;
  fallback: ReactNode;
  /** Delay before chart chunk import — KPI/goals/top performers stay on the critical path. */
  timeoutMs?: number;
};

/** Mount chart children after idle so Recharts is not on the dashboard shell parse path. */
export function DashboardChartsIdleMount({
  children,
  fallback,
  timeoutMs = 120,
}: DashboardChartsIdleMountProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    scheduleIdleWork(() => setReady(true), timeoutMs);
  }, [timeoutMs]);

  if (!ready) return <>{fallback}</>;
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
