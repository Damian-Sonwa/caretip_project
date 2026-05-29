/**
 * Preserve window scroll position across dashboard state updates that reflow layout
 * (period toggles, chart/metric hydration). Does not lock scroll — only restores once
 * after the triggering update's layout pass.
 */
export function runWithViewportScrollPreserved(action: () => void): void {
  const y = window.scrollY;
  action();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (window.scrollY !== y) {
        window.scrollTo({ top: y, left: 0, behavior: "instant" });
      }
    });
  });
}
