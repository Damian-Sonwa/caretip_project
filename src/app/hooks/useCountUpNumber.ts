import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 800;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function valuesEqual(a: number, b: number, integer: boolean): boolean {
  if (!Number.isFinite(a) && !Number.isFinite(b)) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (integer) return Math.round(a) === Math.round(b);
  return Math.abs(a - b) < 0.005;
}

export type UseCountUpNumberOptions = {
  enabled: boolean;
  durationMs?: number;
  reduceMotion: boolean;
  /** Snap interpolated values to integers (counts, percents). */
  integer?: boolean;
};

/**
 * rAF count-up from the last displayed value to `target`.
 * Skips animation when the target is unchanged (avoids polling flicker).
 */
export function useCountUpNumber(
  target: number,
  { enabled, durationMs = DEFAULT_DURATION_MS, reduceMotion, integer = false }: UseCountUpNumberOptions,
): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(() => (reduceMotion ? safeTarget : 0));
  const displayRef = useRef(reduceMotion ? safeTarget : 0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    if (reduceMotion) {
      setDisplay(safeTarget);
      displayRef.current = safeTarget;
      return;
    }

    const from = displayRef.current;
    if (valuesEqual(from, safeTarget, integer)) {
      return;
    }

    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = easeOutCubic(progress);
      const current = from + (safeTarget - from) * eased;
      const shown = integer ? Math.round(current) : current;
      setDisplay(shown);
      displayRef.current = shown;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(safeTarget);
        displayRef.current = safeTarget;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [safeTarget, enabled, reduceMotion, durationMs, integer]);

  return reduceMotion ? safeTarget : display;
}
