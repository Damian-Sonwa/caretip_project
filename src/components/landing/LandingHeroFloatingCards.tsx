import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Coins, Star, Users, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type FloatPillSpec = {
  id: "tip" | "rating" | "staff";
  pillKey: string;
  Icon: LucideIcon;
  floatDuration: number;
  floatDelay: number;
  floatOffset: number;
};

const FLOAT_PILL_BASE = cn(
  "caretip-hero-float-pill pointer-events-none absolute z-[28]",
  "inline-flex max-w-[min(100%,10.75rem)] items-center gap-1.5",
  "rounded-full px-2.5 py-1",
  "text-[10px] font-medium leading-none tracking-tight text-neutral-800/90",
  "sm:gap-2 sm:max-w-[11.25rem] sm:px-3 sm:py-1.5 sm:text-[11px]",
  "lg:z-[31]",
);

/** Glass metric pills — CSS float animation (no Framer Motion). */
export function LandingHeroFloatingCards() {
  const { t } = useTranslation();

  const pills = useMemo<FloatPillSpec[]>(
    () => [
      { id: "tip", pillKey: "landing.showcase.heroFloatPillTip", Icon: Coins, floatDuration: 20, floatDelay: 0, floatOffset: -0.35 },
      { id: "rating", pillKey: "landing.showcase.heroFloatPillRating", Icon: Star, floatDuration: 21, floatDelay: 0.8, floatOffset: -0.3 },
      { id: "staff", pillKey: "landing.showcase.heroFloatPillStaff", Icon: Users, floatDuration: 19, floatDelay: 0.4, floatOffset: -0.35 },
    ],
    [],
  );

  return (
    <div className="caretip-hero-float-cards" aria-hidden>
      {pills.map((pill) => {
        const Icon = pill.Icon;
        return (
          <div
            key={pill.id}
            className={cn(FLOAT_PILL_BASE, `caretip-hero-float-pill--${pill.id}`, "caretip-hero-float-pill--animate")}
            style={
              {
                ["--float-duration" as string]: `${pill.floatDuration}s`,
                ["--float-delay" as string]: `${pill.floatDelay}s`,
                ["--float-offset" as string]: `${pill.floatOffset * 16}px`,
              } as CSSProperties
            }
          >
            <Icon
              className="h-3 w-3 shrink-0 text-primary/75 sm:h-3.5 sm:w-3.5"
              strokeWidth={2}
              aria-hidden
            />
            <span className="min-w-0 truncate whitespace-nowrap">{t(pill.pillKey)}</span>
          </div>
        );
      })}
    </div>
  );
}
