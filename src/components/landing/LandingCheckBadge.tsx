import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** CareTip landing gold badge — keep in sync across hero and benefit sections. */
export const CARETIP_LANDING_CHECK_GRADIENT =
  "linear-gradient(165deg, #fff8e8 0%, #f6d896 48%, #e8b24a 100%)";

const badgeShell =
  "flex w-9 shrink-0 items-center justify-center rounded-[13px] ring-1 ring-amber-900/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_16px_rgba(180,130,40,0.14)] sm:w-10 sm:rounded-2xl";

const uptrendIcon = "h-[1em] w-[1em] max-h-[16px] max-w-[16px] text-neutral-900 sm:max-h-[17px] sm:max-w-[17px]";

export type LandingBenefitTone = "cinematic" | "split" | "default";

type LandingCheckBadgeProps = {
  className?: string;
  /**
   * Match one line of adjacent copy (hero stat lines). Parent row should set
   * `text-*` + `leading-*` so `lh` resolves correctly.
   */
  matchLineHeight?: boolean;
};

export function LandingCheckBadge({ className, matchLineHeight }: LandingCheckBadgeProps) {
  return (
    <span
      className={cn(badgeShell, matchLineHeight ? "h-[1lh]" : "h-9 sm:h-10", className)}
      style={{ background: CARETIP_LANDING_CHECK_GRADIENT }}
      aria-hidden
    >
      <TrendingUp className={uptrendIcon} strokeWidth={2.5} aria-hidden />
    </span>
  );
}

type LandingBenefitChecklistProps = {
  items: string[];
  tone: LandingBenefitTone;
  className?: string;
};

/** Hero-style benefit list: gold check + single-line value props. */
export function LandingBenefitChecklist({ items, tone, className }: LandingBenefitChecklistProps) {
  const textClass = tone === "default" ? "text-foreground" : "text-neutral-900";

  return (
    <ul
      className={cn("mt-5 flex w-full max-w-xl flex-col gap-3 sm:mt-7 sm:gap-3.5", className)}
      role="list"
    >
      {items.map((label, i) => (
        <li
          key={i}
          className="grid min-h-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 text-[15px] font-semibold leading-snug tracking-[-0.015em] sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-4 sm:text-base sm:leading-snug"
          role="listitem"
        >
          <LandingCheckBadge matchLineHeight />
          <span className={cn("min-w-0 [text-wrap:balance]", textClass)}>{label}</span>
        </li>
      ))}
    </ul>
  );
}

type LandingBenefitBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Title line size for grid alignment (default matches employee/business sections). */
  titleClassName?: string;
  bodyClassName?: string;
  className?: string;
};

/**
 * Title + optional body with the same gold uptrend badge used in the hero.
 * For multi-line body copy, badge aligns to the first line (`items-start` + `mt-0.5`).
 */
export function LandingBenefitBlock({
  title,
  description,
  titleClassName,
  bodyClassName,
  className,
}: LandingBenefitBlockProps) {
  return (
    <div
      className={cn(
        "grid min-h-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-4",
        className,
      )}
    >
      <LandingCheckBadge className="mt-0.5" />
      <div className="min-w-0">
        <div className={cn("text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100", titleClassName)}>
          {title}
        </div>
        {description ? (
          <div
            className={cn(
              "mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400",
              bodyClassName,
            )}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}
