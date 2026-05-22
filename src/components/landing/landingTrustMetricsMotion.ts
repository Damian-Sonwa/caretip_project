import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export type TrustMetricId = "scans" | "tips" | "staff" | "teams";

export type TrustMetricAnimSpec = {
  id: TrustMetricId;
  labelKey: string;
  valueKey: string;
  end: number;
  decimals: number;
};

export const TRUST_METRIC_ANIM_SPECS: TrustMetricAnimSpec[] = [
  {
    id: "scans",
    labelKey: "landing.trustMetrics.scansLabel",
    valueKey: "landing.trustMetrics.scansValue",
    end: 48,
    decimals: 0,
  },
  {
    id: "tips",
    labelKey: "landing.trustMetrics.tipsLabel",
    valueKey: "landing.trustMetrics.tipsValue",
    end: 320,
    decimals: 0,
  },
  {
    id: "staff",
    labelKey: "landing.trustMetrics.staffLabel",
    valueKey: "landing.trustMetrics.staffValue",
    end: 1.2,
    decimals: 1,
  },
  {
    id: "teams",
    labelKey: "landing.trustMetrics.teamsLabel",
    valueKey: "landing.trustMetrics.teamsValue",
    end: 85,
    decimals: 0,
  },
];

const COUNT_DURATION_MS = 1750;
const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

/** Locale-aware display for animated trust metrics (matches EN/DE copy). */
export function formatTrustMetricValue(
  id: TrustMetricId,
  value: number,
  decimals: number,
  locale: string,
): string {
  const isDe = locale.toLowerCase().startsWith("de");
  const rounded = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));

  switch (id) {
    case "scans":
      return isDe ? `${Math.round(value)} T+` : `${Math.round(value)}K+`;
    case "tips":
      return isDe ? `${Math.round(value)}\u00a0Tsd.\u00a0€+` : `€${Math.round(value)}K+`;
    case "staff":
      return isDe
        ? `${(decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))).replace(".", ",")} T+`
        : `${decimals > 0 ? value.toFixed(decimals) : Math.round(value)}K+`;
    case "teams":
      return `${Math.round(value)}+`;
    default:
      return rounded;
  }
}

export function useTrustMetricCountUp(
  end: number,
  active: boolean,
  delayMs: number,
  reduceMotion: boolean | null,
) {
  const [value, setValue] = useState(reduceMotion ? end : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(end);
      return;
    }
    if (!active) {
      setValue(0);
      return;
    }

    let raf = 0;
    let startTime: number | null = null;
    const timeout = window.setTimeout(() => {
      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
        setValue(end * EASE_OUT_CUBIC(progress));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [active, delayMs, end, reduceMotion]);

  return value;
}
