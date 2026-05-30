/** Unified stroke for Lucide + CareTip custom icons (matches Lucide default density). */
export const CARE_ICON_STROKE_WIDTH = 1.75 as const;

export type CareIconSize = "xs" | "sm" | "nav" | "md" | "lg" | "xl";

/** Tailwind size classes — use via CareIcon `size` prop for consistent scaling. */
export const CARE_ICON_SIZE_CLASS: Record<CareIconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  nav: "h-[1.125rem] w-[1.125rem]",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};
