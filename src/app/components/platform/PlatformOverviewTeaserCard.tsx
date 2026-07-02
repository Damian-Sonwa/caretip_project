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
    <section className={cn(platformUi.overviewTeaserCard, "flex h-full min-h-[12rem] flex-col", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">{title}</h2>
          {!compact && description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
          ) : null}
        </div>
        <Link to={viewAllHref} className="dashboard-view-all-link">
          <span>{viewAllLabel}</span>
          <ArrowRight className="dashboard-view-all-link__icon" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      {metrics.length > 0 ? (
        <div
          className={cn(
            "grid gap-3 sm:gap-4",
            metrics.length <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3",
            children ? "mb-5" : "",
          )}
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="platform-overview-teaser-metric rounded-lg border border-border/80 bg-muted/15"
            >
              <p className="platform-overview-teaser-metric__label">{metric.label}</p>
              <p className="platform-overview-teaser-metric__value tabular-nums text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {children ? <div className="min-w-0 flex-1 border-t border-border/60 pt-4">{children}</div> : null}
    </section>
  );
}
