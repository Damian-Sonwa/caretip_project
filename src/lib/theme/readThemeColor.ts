import type { CSSProperties } from "react";

/** Read a CSS custom property from :root (HSL components → `hsl(...)`). */
export function readThemeHsl(varName: string, alpha?: number): string {
  if (typeof document === "undefined") {
    return alpha != null ? `hsl(0 0% 50% / ${alpha})` : "hsl(0 0% 50%)";
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return alpha != null ? `hsl(0 0% 50% / ${alpha})` : "hsl(0 0% 50%)";
  return alpha != null ? `hsl(${raw} / ${alpha})` : `hsl(${raw})`;
}

/** Recharts-friendly tooltip surface using semantic tokens. */
export function dashboardChartTooltipStyle(): CSSProperties {
  return {
    backgroundColor: readThemeHsl("--card"),
    border: `1px solid ${readThemeHsl("--border")}`,
    borderRadius: "10px",
    color: readThemeHsl("--foreground"),
    fontSize: "12px",
    boxShadow: "0 8px 24px -8px hsl(0 0% 0% / 0.12)",
  };
}
