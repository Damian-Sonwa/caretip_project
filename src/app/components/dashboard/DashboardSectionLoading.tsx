import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";

/** Compact spinner for inline labels and section headers. */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner
      size="sm"
      className={cn("!h-3.5 !w-3.5 shrink-0 border-[1.5px] text-primary/70", className)}
      aria-hidden
    />
  );
}

/** Spinner + label for chart, goals, and analytics panels. */
export function AnalyticsLoadingState({
  label,
  className,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
  ariaLabel,
}: {
  label: string;
  className?: string;
  minHeightClass?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2.5",
        minHeightClass,
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel ?? label}
    >
      <LoadingSpinner size="sm" className="text-primary/70" />
      <p className="text-center text-xs font-medium tracking-wide text-muted-foreground/80">{label}</p>
    </div>
  );
}

/** Reserved panel region — preserves card height during fetch. */
export function SectionLoader({
  label,
  className,
  minHeightClass = "min-h-[220px] sm:min-h-[260px]",
}: {
  label?: string;
  className?: string;
  minHeightClass?: string;
}) {
  return (
    <AnalyticsLoadingState
      label={label ?? ""}
      className={className}
      minHeightClass={minHeightClass}
      ariaLabel={label}
    />
  );
}

/** Soft opacity reveal when section data is ready (no layout jump). */
export function DeferredContentFade({
  show,
  children,
  className,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "transition-[opacity] duration-300",
        !show && "pointer-events-none",
        className,
      )}
      aria-hidden={!show ? true : undefined}
    >
      {children}
    </motion.div>
  );
}

/** Employee goals table shell — keeps header + height while goals sync. */
export function GoalsTableLoadingShell({
  label,
  columnLabels,
  className,
}: {
  label: string;
  columnLabels: string[];
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 overflow-x-auto", className)} aria-busy="true" aria-live="polite">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            {columnLabels.map((col) => (
              <th key={col} className="pb-2 pr-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <AnalyticsLoadingState
        label={label}
        minHeightClass="min-h-[180px] sm:min-h-[200px]"
      />
    </div>
  );
}

/** Subtle coordinated-loading hint below analytics period controls. */
export function DashboardAnalyticsPhaseHint({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-medium text-muted-foreground/85",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <InlineSpinner />
      <span>{label}</span>
    </div>
  );
}
