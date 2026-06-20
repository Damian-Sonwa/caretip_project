/** Run non-critical startup work after first paint (with timeout fallback). */
export function runWhenIdle(fn: () => void, timeoutMs = 2_000): void {
  if (typeof window === "undefined") return;
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(fn, { timeout: timeoutMs });
    return;
  }
  window.setTimeout(fn, 0);
}
