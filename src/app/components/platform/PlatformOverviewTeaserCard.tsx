import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { platformUi } from "./platformDashboardUi";

export type PlatformOverviewMetric = {
  label: string;
  value: string;
};

type PlatformOverviewTeaserCardProps = {
  title: string;
  description?: string;
  metrics: PlatformOverviewMetric[];
  viewAllHref: string;
  viewAllLabel: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function PlatformOverviewTeaserCard({
  title,
  description,
  metrics,
  viewAllHref,
  viewAllLabel,
  children,
  className,
  compact = true,
}: PlatformOverviewTeaserCardProps) {
  return (
    <section className={cn(platformUi.overviewTeaserCard, "flex h-full flex-col", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">{title}</h2>
          {!compact && description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
          ) : null}
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline sm:text-sm"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
        </Link>
      </div>

      {metrics.length > 0 ? (
        <div
          className={cn(
            "grid gap-2.5",
            metrics.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
            children ? "mb-4" : "",
          )}
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5"
            >
              <p className="text-[11px] font-medium leading-snug text-muted-foreground sm:text-xs">{metric.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground sm:text-lg">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {children ? <div className="min-w-0 flex-1 border-t border-border/60 pt-4">{children}</div> : null}
    </section>
  );
}
