import { useMemo } from "react";
import { Coins, Star, Users, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type FloatPillSpec = {
  id: string;
  pillKey: string;
  Icon: LucideIcon;
  position: string;
  floatDuration: number;
  floatDelay: number;
  floatOffset: number;
};

const FLOAT_PILL_BASE = cn(
  "caretip-hero-float-pill pointer-events-none absolute z-[28]",
  "inline-flex max-w-[min(calc(100%-0.5rem),11.5rem)] items-center gap-1.5",
  "rounded-full border border-white/55 bg-white/48 px-2.5 py-1",
  "shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur-md",
  "ring-1 ring-white/30",
  "text-[10px] font-medium leading-none tracking-tight text-neutral-800",
  "sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]",
  "lg:z-[31]",
);

/**
 * Lightweight glass metric pills anchored to the hero device edges.
 */
export function LandingHeroFloatingCards() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const pills = useMemo<FloatPillSpec[]>(
    () => [
      {
        id: "tip",
        pillKey: "landing.showcase.heroFloatPillTip",
        Icon: Coins,
        position:
          "top-[11%] left-0 max-lg:top-[10%] max-lg:-left-0.5 sm:max-lg:left-0 lg:top-[13%] lg:left-[1.5%]",
        floatDuration: 13,
        floatDelay: 0,
        floatOffset: -2.5,
      },
      {
        id: "rating",
        pillKey: "landing.showcase.heroFloatPillRating",
        Icon: Star,
        position:
          "top-[13%] right-0 max-lg:top-[12%] max-lg:-right-0.5 sm:max-lg:right-0 lg:top-[15%] lg:right-[2%] lg:z-[32]",
        floatDuration: 14.5,
        floatDelay: 0.8,
        floatOffset: -2,
      },
      {
        id: "staff",
        pillKey: "landing.showcase.heroFloatPillStaff",
        Icon: Users,
        position:
          "bottom-[15%] right-0 max-lg:bottom-[14%] max-lg:-right-0.5 sm:max-lg:right-0 lg:bottom-[17%] lg:right-[2.5%]",
        floatDuration: 12.5,
        floatDelay: 0.4,
        floatOffset: -2.5,
      },
    ],
    [],
  );

  return (
    <div
      className="caretip-hero-float-cards pointer-events-none absolute inset-0 z-30 overflow-visible max-lg:overflow-visible lg:overflow-hidden"
      aria-hidden
    >
      {pills.map((pill) => {
        const Icon = pill.Icon;
        return (
          <motion.div
            key={pill.id}
            className={cn(FLOAT_PILL_BASE, pill.position)}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 1,
                    y: [0, pill.floatOffset, 0],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.5, delay: pill.floatDelay * 0.12 }
                : {
                    opacity: { duration: 0.55, delay: pill.floatDelay * 0.12, ease: "easeOut" },
                    y: {
                      duration: pill.floatDuration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: pill.floatDelay,
                    },
                  }
            }
          >
            <Icon
              className="h-3 w-3 shrink-0 text-primary/75 sm:h-3.5 sm:w-3.5"
              strokeWidth={2}
              aria-hidden
            />
            <span className="min-w-0 truncate whitespace-nowrap">{t(pill.pillKey)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
