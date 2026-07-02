/** Shared Recharts props — animations off for faster paint and fewer re-render costs. */
export const CHART_ANIMATION_OFF = { isAnimationActive: false } as const;

export const LIGHTWEIGHT_LINE = {
  type: "monotone" as const,
  dot: false,
  ...CHART_ANIMATION_OFF,
};

export const LIGHTWEIGHT_AREA = {
  type: "monotone" as const,
  dot: false,
  strokeWidth: 2,
  ...CHART_ANIMATION_OFF,
};

export const LIGHTWEIGHT_BAR = {
  ...CHART_ANIMATION_OFF,
};
