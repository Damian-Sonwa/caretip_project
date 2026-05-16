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
  const textClass =
    tone === "default"
      ? "text-foreground"
      : "text-neutral-900 dark:text-neutral-50";

  return (
    <ul
      className={cn(
        "mt-5 flex w-full max-w-xl flex-col gap-3 sm:mt-7 sm:gap-3.5",
        tone === "cinematic" && "max-md:mt-0 max-md:gap-3 max-md:max-w-full",
        className,
      )}
      role="list"
    >
      {items.map((label, i) => (
        <li
          key={i}
          className={cn(
            "grid min-h-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 text-[15px] font-semibold leading-snug tracking-[-0.015em] sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-4 sm:text-base sm:leading-snug",
            tone === "cinematic" &&
              "max-md:grid-cols-[2.5rem_minmax(0,1fr)] max-md:gap-x-3.5 max-md:text-[15px] max-md:font-semibold max-md:leading-[1.45] max-md:tracking-[-0.012em] sm:text-[17px] sm:leading-[1.42]",
          )}
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
  /** Premium split-layout showcase (alternating landing sections). */
  variant?: "default" | "split" | "showcase";
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
  variant = "default",
}: LandingBenefitBlockProps) {
  const isSplit = variant === "split" || variant === "showcase";

  return (
    <div
      className={cn(
        "grid min-h-0 items-start",
        isSplit
          ? cn(
              "grid-cols-[3rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[3.25rem_minmax(0,1fr)]",
              "py-3.5 sm:py-4",
            )
          : "grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          isSplit
            ? "h-11 w-11 rounded-xl bg-primary/[0.12] ring-1 ring-primary/20 sm:h-12 sm:w-12"
            : "mt-0.5",
        )}
      >
        <LandingCheckBadge
          className={cn(isSplit && "h-9 w-9 rounded-[11px] sm:h-10 sm:w-10")}
        />
      </div>
      <div className={cn("min-w-0", isSplit ? "space-y-2 sm:space-y-2.5" : "space-y-1.5 sm:space-y-2")}>
        <div
          className={cn(
            isSplit
              ? "text-[17px] font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-50"
              : "text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100",
            titleClassName,
          )}
        >
          {title}
        </div>
        {description ? (
          <div
            className={cn(
              isSplit
                ? "max-w-[38ch] text-[15px] font-normal leading-[1.65] text-neutral-700 dark:text-neutral-300 sm:text-base"
                : "text-[15px] font-medium leading-[1.55] text-neutral-600 dark:text-neutral-400 sm:text-sm sm:font-normal sm:leading-relaxed",
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
