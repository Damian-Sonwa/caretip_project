import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { caretipType } from "@/lib/typography/caretipType";
import { cn } from "@/lib/utils";

/** CareTip landing gold badge — keep in sync across hero and benefit sections. */
export const CARETIP_LANDING_CHECK_GRADIENT =
  "linear-gradient(165deg, #fff8e8 0%, #f6d896 48%, #e8b24a 100%)";

/** Shared icon+text row — hero, hospitality, showcases, and all uptrend lists. */
export const landingUptrendRowGrid =
  "grid min-h-0 grid-cols-[auto_minmax(0,1fr)] gap-x-1.5 sm:gap-x-2";

const badgeShell =
  "flex w-7 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-amber-900/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_8px_rgba(180,130,40,0.08)] max-md:w-7 max-md:rounded-[10px] sm:w-9 sm:rounded-[13px] sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_16px_rgba(180,130,40,0.14)] lg:w-10 lg:rounded-2xl";

const uptrendIcon =
  "h-[1em] w-[1em] max-h-[12px] max-w-[12px] text-neutral-900 max-md:max-h-[12px] max-md:max-w-[12px] sm:max-h-[16px] sm:max-w-[16px] lg:max-h-[17px] lg:max-w-[17px]";

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
      className={cn(badgeShell, matchLineHeight ? "h-[1lh]" : "h-7 sm:h-9 lg:h-10", className)}
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
        "mt-5 flex w-full max-w-xl flex-col gap-2.5 sm:mt-7 sm:gap-3.5",
        tone === "cinematic" && "max-md:mt-0 max-md:gap-3 max-md:max-w-full",
        className,
      )}
      role="list"
    >
      {items.map((label, i) => (
        <li
          key={i}
          className={cn(
            landingUptrendRowGrid,
            "items-center",
            caretipType.featureCopySemibold,
            textClass,
          )}
          role="listitem"
        >
          <LandingCheckBadge matchLineHeight />
          <span className="min-w-0 [text-wrap:balance]">{label}</span>
        </li>
      ))}
    </ul>
  );
}

type LandingBenefitBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  titleClassName?: string;
  bodyClassName?: string;
  className?: string;
  variant?: "default" | "split" | "showcase";
};

export function LandingBenefitBlock({
  title,
  description,
  titleClassName,
  bodyClassName,
  className,
  variant = "default",
}: LandingBenefitBlockProps) {
  const isRich = variant === "split" || variant === "showcase";

  return (
    <div className={cn(landingUptrendRowGrid, "items-start", className)}>
      <LandingCheckBadge className="mt-0.5 shrink-0 self-start" />
      <div
        className={cn(
          "min-w-0",
          isRich ? "space-y-1 max-md:space-y-1 sm:space-y-1.5 lg:space-y-2" : "space-y-1.5 sm:space-y-2",
        )}
      >
        <div
          className={cn(
            isRich ? caretipType.featureCopySemibold : caretipType.cardTitle,
            titleClassName,
          )}
        >
          {title}
        </div>
        {description ? (
          <div className={cn(caretipType.bodyCopyMuted, bodyClassName)}>{description}</div>
        ) : null}
      </div>
    </div>
  );
}
