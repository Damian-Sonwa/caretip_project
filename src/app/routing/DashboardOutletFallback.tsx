import { DashboardStatsGridSpinner } from "../components/dashboard/DashboardAnalyticsLoader";

/** In-layout route chunk fallback — keeps sidebar/header stable; only main content loads. */
export function DashboardOutletFallback() {
  return (
    <div
      className="flex w-full min-h-[min(50vh,420px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading page"
    >
      <DashboardStatsGridSpinner />
    </div>
  );
}

/** Top-level public route chunk — minimal footprint to avoid layout flicker. */
export function MinimalRouteFallback() {
  return (
    <div className="min-h-[40vh] w-full" role="status" aria-busy="true" aria-live="polite" aria-hidden />
  );
}
