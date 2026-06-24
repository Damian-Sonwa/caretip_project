import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { CaretipPremiumBackdrop } from "@/app/components/premium/CaretipPremiumBackdrop";
import { cn } from "@/lib/utils";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";
import { heroPersonalityDataAttr } from "@/lib/heroPersonalitySystem";

export type PremiumSummaryMetric = {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  trendDirection?: "up" | "down" | "neutral";
};

export type PremiumSummaryCardProps = {
  title?: string;
  eyebrow?: ReactNode;
  periodLabel?: string;
  metrics: PremiumSummaryMetric[];
  footer?: ReactNode;
  className?: string;
  variant?: "banner" | "health";
  personality?: HeroPersonality;
};

function TrendIcon({ direction }: { direction?: "up" | "down" | "neutral" }) {
  if (direction === "up") return <TrendingUp className="mr-1 inline h-3.5 w-3.5" aria-hidden />;
  if (direction === "down") return <TrendingDown className="mr-1 inline h-3.5 w-3.5" aria-hidden />;
  return null;
}

/**
 * Premium gradient summary — analytics banner, business health, or executive snapshot header.
 */
export function PremiumSummaryCard({
  title,
  eyebrow,
  periodLabel,
  metrics,
  footer,
  className,
  variant = "banner",
  personality,
}: PremiumSummaryCardProps) {
  return (
    <section
      className={cn(premiumVisualClasses.summaryCard, className)}
      aria-label={title}
      {...(personality ? heroPersonalityDataAttr(personality) : {})}
    >
      <CaretipPremiumBackdrop personality={personality} />
      <div className="premium-summary-card__inner">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            {eyebrow ? <div>{eyebrow}</div> : null}
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
            ) : null}
          </div>
          {periodLabel ? (
            <span className="premium-badge shrink-0">{periodLabel}</span>
          ) : null}
        </div>

        <div
          className={cn(
            "grid gap-3",
            variant === "health" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
          )}
        >
          {metrics.map((metric) => (
            <div key={metric.label} className="premium-summary-card__metric">
              <p className="premium-summary-card__metric-label">{metric.label}</p>
              <div className="premium-summary-card__metric-value">{metric.value}</div>
              {metric.trend ? (
                <p
                  className={cn(
                    "premium-summary-card__metric-trend",
                    metric.trendDirection === "up" && "premium-summary-card__metric-trend--up",
                    metric.trendDirection === "down" && "premium-summary-card__metric-trend--down",
                  )}
                >
                  <TrendIcon direction={metric.trendDirection} />
                  {metric.trend}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {footer ? <div className="mt-4 border-t border-white/10 pt-4 text-sm text-white/85">{footer}</div> : null}
      </div>
    </section>
  );
}
