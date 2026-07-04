/** True when advanced analytics capability newly enabled after initial render. */
export function shouldRefetchOnAnalyticsCapabilityUpgrade(
  previous: boolean | null,
  next: boolean,
): boolean {
  if (!next) return false;
  if (previous === null) return false;
  return previous !== next;
}

function parseRootMarginPx(rootMargin: string): number {
  const match = rootMargin.trim().match(/^(-?\d+(?:\.\d+)?)px$/);
  return match ? Number.parseFloat(match[1]!) : 0;
}

/** Best-effort viewport check when IntersectionObserver is unavailable or delayed. */
export function isDashboardChartSlotNearViewport(
  node: HTMLElement | null,
  rootMargin = "120px",
): boolean {
  if (!node || typeof window === "undefined") return false;
  const margin = parseRootMarginPx(rootMargin);
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom >= -margin && rect.top <= viewportHeight + margin;
}
