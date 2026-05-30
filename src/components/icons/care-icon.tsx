import { cn } from "@/lib/utils";
import {
  CARE_ICON_SIZE_CLASS,
  CARE_ICON_STROKE_WIDTH,
  type CareIconSize,
} from "./caretip-icon.constants";
import { CARE_ICON_REGISTRY, type CareIconName } from "./care-icon-registry";

export type CareIconProps = {
  name: CareIconName;
  size?: CareIconSize;
  className?: string;
  strokeWidth?: number;
  /** Accessible label — when set, icon is not hidden from assistive tech. */
  "aria-label"?: string;
  "aria-hidden"?: boolean;
};

/**
 * Unified CareTip icon — Lucide for generic UI, custom SVGs for product semantics.
 * Uses `currentColor` for theme-aware light/dark surfaces.
 */
/** Lucide-compatible wrapper for StatCard / legacy `icon: LucideIcon` props. */
export function createCareStatIcon(name: CareIconName) {
  function CareStatIcon({ className }: { className?: string }) {
    return <CareIcon name={name} size="md" className={className} />;
  }
  CareStatIcon.displayName = `CareStatIcon(${name})`;
  return CareStatIcon;
}

export function CareIcon({
  name,
  size = "md",
  className,
  strokeWidth = CARE_ICON_STROKE_WIDTH,
  ...aria
}: CareIconProps) {
  const Icon = CARE_ICON_REGISTRY[name];
  const sizeClass = CARE_ICON_SIZE_CLASS[size];
  const hidden = aria["aria-label"] ? undefined : aria["aria-hidden"] ?? true;

  return (
    <Icon
      className={cn("shrink-0", sizeClass, className)}
      strokeWidth={strokeWidth}
      aria-hidden={hidden}
      aria-label={aria["aria-label"]}
      role={aria["aria-label"] ? "img" : undefined}
    />
  );
}
