import type { ReactNode } from "react";
import { CaretipPremiumBackdrop } from "@/app/components/premium/CaretipPremiumBackdrop";
import { cn } from "@/lib/utils";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";

export type PremiumLiveActivityCardProps = {
  title: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Dark live-activity surface with orange glow accents — not a full-page gradient.
 */
export function PremiumLiveActivityCard({
  title,
  headerExtra,
  children,
  className,
}: PremiumLiveActivityCardProps) {
  return (
    <div className={cn(premiumVisualClasses.liveCard, className)}>
      <CaretipPremiumBackdrop />
      <div className="premium-live-card__accent" aria-hidden />
      <div className="premium-live-card__header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <h3 className="truncate text-base font-semibold text-white">{title}</h3>
        </div>
        {headerExtra}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
