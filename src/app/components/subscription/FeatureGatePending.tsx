import { cn } from "@/lib/utils";

type FeatureGatePendingProps = {
  className?: string;
  compact?: boolean;
};

/** Placeholder while entitlements resolve — never renders protected page content. */
export function FeatureGatePending({ className, compact = false }: FeatureGatePendingProps) {
  return (
    <div
      className={cn(
        "feature-gate-pending rounded-2xl border border-border/50 bg-muted/15",
        compact ? "min-h-[8rem]" : "min-h-[12rem]",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    />
  );
}
