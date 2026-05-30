import { DashboardMetricsGridSkeleton } from "../components/dashboard/DashboardSectionLoading";

/**
 * In-layout lazy-route hold — reserves main content height without a second skeleton pass.
 * Dashboard pages own first-load skeletons; avoids Loader → Outlet skeleton → page skeleton.
 */
export function DashboardOutletShellHold() {
  return (
    <div
      className="w-full min-h-[min(50vh,420px)]"
      aria-hidden
    />
  );
}

/** Full skeleton fallback — use only outside dashboard shell (e.g. standalone chunk routes). */
export function DashboardOutletFallback() {
  return (
    <div
      className="flex w-full min-h-[min(50vh,420px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading page"
    >
      <DashboardMetricsGridSkeleton />
    </div>
  );
}

/** Top-level public route chunk — skeleton immediately (no blank flash). */
export function MinimalRouteFallback() {
  return (
    <div
      className="flex w-full min-h-[40vh] items-center justify-center px-4 py-8"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading page"
    >
      <DashboardMetricsGridSkeleton />
    </div>
  );
}
