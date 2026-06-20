import { useEffect, useLayoutEffect } from "react";

declare global {
  interface Window {
    __caretipMountCosts?: Array<{ name: string; ms: number }>;
    __caretipRouteMountStart?: number;
  }
}

/** Records layout-to-paint mount cost when mount audit mode is enabled. */
export function usePublicMountProbe(name: string): void {
  useLayoutEffect(() => {
    if (!window.__caretipMountCosts) return;
    performance.mark(`caretip-public-mount:${name}`);
  }, [name]);

  useEffect(() => {
    if (!window.__caretipMountCosts) return;
    const endMark = `caretip-public-mounted:${name}`;
    performance.mark(endMark);
    try {
      const measure = performance.measure(
        `caretip-public:${name}`,
        `caretip-public-mount:${name}`,
        endMark,
      );
      window.__caretipMountCosts.push({ name, ms: Math.round(measure.duration) });
    } catch {
      window.__caretipMountCosts.push({ name, ms: 0 });
    }
  }, [name]);
}

export function enablePublicMountAudit(): void {
  window.__caretipMountCosts = [];
}

export function markPublicRouteMountStart(): void {
  window.__caretipRouteMountStart = performance.now();
}

export function readPublicMountCosts(): Array<{ name: string; ms: number }> {
  return [...(window.__caretipMountCosts ?? [])].sort((a, b) => b.ms - a.ms);
}

export function readPublicRouteMountStart(): number | null {
  return window.__caretipRouteMountStart ?? null;
}
