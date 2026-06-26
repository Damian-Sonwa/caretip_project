import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { scheduleIdleWork } from "@/lib/publicRouteDefer";

type DashboardChartsIdleMountProps = {
  children: ReactNode;
  fallback: ReactNode;
  /** Delay before chart chunk import — KPI/goals/top performers stay on the critical path. */
  timeoutMs?: number;
  /** When true, also wait until the slot is near the viewport (Sprint 8.1). */
  whenVisible?: boolean;
  rootMargin?: string;
  /** Fires once when idle + visibility gates pass — use to start deferred data fetches. */
  onReady?: () => void;
};

/** Mount chart children after idle so Recharts is not on the dashboard shell parse path. */
export function DashboardChartsIdleMount({
  children,
  fallback,
  timeoutMs = 120,
  whenVisible = false,
  rootMargin = "120px",
  onReady,
}: DashboardChartsIdleMountProps) {
  const [idleReady, setIdleReady] = useState(false);
  const [visible, setVisible] = useState(!whenVisible);
  const slotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scheduleIdleWork(() => setIdleReady(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (!whenVisible) {
      setVisible(true);
      return;
    }
    const node = slotRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [whenVisible, rootMargin]);

  const ready = idleReady && visible;
  const onReadyFiredRef = useRef(false);

  useEffect(() => {
    if (!ready || !onReady || onReadyFiredRef.current) return;
    onReadyFiredRef.current = true;
    onReady();
  }, [ready, onReady]);

  if (!ready) {
    return (
      <div ref={whenVisible ? slotRef : undefined} aria-hidden={whenVisible ? true : undefined}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={whenVisible ? slotRef : undefined}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </div>
  );
}
