import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type HospitalityFeatureMarkerProps = {
  active?: boolean;
  className?: string;
};

/**
 * Minimal uptrend marker for #built-for-hospitality — no filled circles or hover glows.
 */
export function HospitalityFeatureMarker({ active = false, className }: HospitalityFeatureMarkerProps) {
  return (
    <span
      className={cn(
        "mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center transition-[color,opacity] duration-300 ease-out sm:mt-2",
        className,
      )}
      aria-hidden
    >
      <TrendingUp
        className={cn(
          "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
          active
            ? "text-primary opacity-100"
            : "text-neutral-400 opacity-70 group-hover:text-neutral-500 group-hover:opacity-85 dark:text-neutral-500 dark:group-hover:text-neutral-400",
        )}
        strokeWidth={2.25}
      />
    </span>
  );
}
