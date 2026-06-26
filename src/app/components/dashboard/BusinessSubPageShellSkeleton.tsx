import { useDashboardShellAria } from "@/app/hooks/useDashboardShellAria";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { cn } from "@/lib/utils";

type BusinessSubPageShellSkeletonProps = {
  /** Matches `dashboard-page-narrow` support-style pages. */
  narrow?: boolean;
};

/** Page chrome while auth session hydrates inside `BusinessLayout` (no full-screen hold). */
export function BusinessSubPageShellSkeleton({ narrow = false }: BusinessSubPageShellSkeletonProps) {
  const aria = useDashboardShellAria();

  return (
    <main className={businessUi.modulePageShell} aria-busy="true" aria-label={aria.loading}>
      <div
        className={cn(
          "mx-auto w-full animate-pulse",
          narrow ? "dashboard-page-narrow max-w-3xl" : businessUi.modulePageContained,
        )}
      >
        <div className="mb-4 space-y-2">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-8 w-56 rounded bg-muted sm:w-72" />
          <div className="h-4 w-full max-w-md rounded bg-muted" />
        </div>
        <div className="h-64 rounded-xl bg-muted sm:h-80" />
      </div>
    </main>
  );
}
