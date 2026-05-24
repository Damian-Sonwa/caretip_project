import { useMemo } from "react";
import { Coins, Star, Users, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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
  "inline-flex max-w-[min(100%,11.5rem)] items-center gap-1.5",
  "rounded-full border border-white/55 bg-white/48 px-2.5 py-1",
  "shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur-md",
  "ring-1 ring-white/30",
  "text-[10px] font-medium leading-none tracking-tight text-neutral-800",
  "sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]",
  "lg:z-[31]",
);

/**
 * Glass metric pills — positions from caretip-landing-hero-visual-refine.css
 * (anchored to the device composition, not the full column).
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
        floatDuration: 14,
        floatDelay: 0,
        floatOffset: -1.5,
      },
      {
        id: "rating",
        pillKey: "landing.showcase.heroFloatPillRating",
        Icon: Star,
        floatDuration: 15,
        floatDelay: 0.7,
        floatOffset: -1.25,
      },
      {
        id: "staff",
        pillKey: "landing.showcase.heroFloatPillStaff",
        Icon: Users,
        floatDuration: 13.5,
        floatDelay: 0.35,
        floatOffset: -1.5,
      },
    ],
    [],
  );

  return (
    <div className="caretip-hero-float-cards" aria-hidden>
      {pills.map((pill) => {
        const Icon = pill.Icon;
        return (
          <motion.div
            key={pill.id}
            className={cn(FLOAT_PILL_BASE, `caretip-hero-float-pill--${pill.id}`)}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
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
