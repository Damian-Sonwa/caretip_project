/**
 * In-layout lazy-route hold — background only; login/refresh use the global overlay spinner.
 */
export function DashboardOutletShellHold() {
  return <div className="min-h-[min(50vh,420px)] w-full bg-background" aria-hidden />;
}

/** Full-page lazy hold outside dashboard shell. */
export function DashboardOutletFallback() {
  return <div className="min-h-[min(50vh,420px)] w-full bg-background" aria-hidden />;
}

/** Top-level public route chunk hold — matches global overlay background during lazy auth loads. */
export function MinimalRouteFallback() {
  return <div className="min-h-[100dvh] w-full bg-background" aria-hidden />;
}
