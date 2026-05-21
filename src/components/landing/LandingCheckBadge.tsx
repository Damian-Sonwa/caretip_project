import type { ReactNode } from "react";
import { LandingLiveMinutesMarker, landingLiveMinutesRowClass } from "@/components/landing/LandingLiveMinutesMarker";
import { caretipType } from "@/lib/typography/caretipType";
import { cn } from "@/lib/utils";

/** @deprecated Use `landingLiveMinutesRowClass` — kept for imports that reference the grid helper. */
export const landingUptrendRowGrid = landingLiveMinutesRowClass;

export type LandingBenefitTone = "cinematic" | "split" | "default";

type LandingBenefitChecklistProps = {
  items: string[];
  tone: LandingBenefitTone;
  className?: string;
};

/** Hero-style benefit list — Live in Minutes circular uptrend marker. */
export function LandingBenefitChecklist({ items, tone, className }: LandingBenefitChecklistProps) {
  const textClass =
    tone === "default"
      ? "text-foreground"
      : "text-neutral-900 dark:text-neutral-50";

  return (
    <ul
      className={cn(
        "mt-5 flex w-full max-w-xl flex-col gap-2.5 sm:mt-7 sm:gap-3.5",
        tone === "cinematic" && "max-md:mt-0 max-md:gap-2.5 max-md:max-w-full",
        className,
      )}
      role="list"
    >
      {items.map((label, i) => (
        <li
          key={i}
          className={cn(landingLiveMinutesRowClass, caretipType.featureCopy, textClass)}
          role="listitem"
        >
          <LandingLiveMinutesMarker className="shrink-0 self-start" />
          <span className="min-w-0 pt-1 [text-wrap:balance]">{label}</span>
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
  active?: boolean;
};

export function LandingBenefitBlock({
  title,
  description,
  titleClassName,
  bodyClassName,
  className,
  variant = "default",
  active = false,
}: LandingBenefitBlockProps) {
  const isRich = variant === "split" || variant === "showcase";

  return (
    <div className={cn(landingLiveMinutesRowClass, className)}>
      <LandingLiveMinutesMarker active={active} className="mt-0.5 shrink-0 self-start" />
      <div
        className={cn(
          "min-w-0 flex-1",
          isRich ? "space-y-1 max-md:space-y-1 sm:space-y-1.5 lg:space-y-2" : "space-y-1.5 sm:space-y-2",
        )}
      >
        <div
          className={cn(
            isRich ? caretipType.featureCopySemibold : caretipType.cardTitle,
            "tracking-tight",
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

/** @deprecated Use `LandingLiveMinutesMarker` — alias for gradual migration. */
export function LandingCheckBadge({
  className,
  active,
}: {
  className?: string;
  matchLineHeight?: boolean;
  active?: boolean;
}) {
  return <LandingLiveMinutesMarker active={active} className={className} />;
}
