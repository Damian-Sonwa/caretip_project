import { memo, useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { useCountUpNumber } from "../../hooks/useCountUpNumber";
import { formatEur } from "../../lib/formatEur";
import { cn } from "@/lib/utils";

export type CountUpMetricKind = "eur" | "eur-whole" | "integer" | "decimal" | "percent";

export type CountUpMetricProps = {
  value: number;
  kind?: CountUpMetricKind;
  className?: string;
  /** 600–1000ms recommended; default 800ms ease-out. */
  durationMs?: number;
  /** Overrides built-in kind formatting (e.g. preserve rating string rules). */
  format?: (animatedValue: number) => string;
  decimalPlaces?: number;
};

function formatByKind(kind: CountUpMetricKind, n: number, decimalPlaces: number): string {
  switch (kind) {
    case "eur":
      return formatEur(n);
    case "eur-whole":
      return formatEur(n, { minFrac: 0, maxFrac: 0 });
    case "integer":
      return String(Math.round(n));
    case "decimal":
      return n.toLocaleString("de-DE", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    case "percent":
      return `${Math.round(n)}%`;
    default:
      return String(n);
  }
}

function isIntegerKind(kind: CountUpMetricKind): boolean {
  return kind === "integer" || kind === "percent";
}

/**
 * Animated dashboard metric value (0 → target on first paint; smooth updates when data changes).
 * Respects prefers-reduced-motion; no-ops when the numeric target is unchanged.
 */
export const CountUpMetric = memo(function CountUpMetric({
  value,
  kind = "integer",
  className,
  durationMs = 800,
  format,
  decimalPlaces = 1,
}: CountUpMetricProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const safeValue = Number.isFinite(value) ? value : 0;
  const integer = isIntegerKind(kind);

  const animated = useCountUpNumber(safeValue, {
    enabled: true,
    durationMs,
    reduceMotion,
    integer,
  });

  const text = useMemo(() => {
    if (format) return format(animated);
    return formatByKind(kind, animated, decimalPlaces);
  }, [animated, format, kind, decimalPlaces]);

  return (
    <span className={cn("tabular-nums", className)} aria-live="off">
      {text}
    </span>
  );
});
