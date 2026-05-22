import { useMemo } from "react";
import { CheckCircle2, Coins, Star, Users, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type FloatSpec = {
  id: string;
  valueKey: string;
  labelKey: string;
  Icon: LucideIcon;
  position: string;
  floatDuration: number;
  floatDelay: number;
};

const FLOAT_CARD_BASE = cn(
  "caretip-hero-float-card pointer-events-none absolute",
  "max-w-[min(calc(100%-1rem),168px)] rounded-xl border border-white/50",
  "bg-white/76 shadow-[0_2px_8px_rgba(15,23,42,0.05),0_10px_28px_-8px_rgba(15,23,42,0.09)]",
  "backdrop-blur-lg ring-1 ring-white/40",
  "max-lg:max-w-[min(calc(100%-0.75rem),132px)] max-lg:scale-[0.78] max-lg:origin-center",
  "sm:max-lg:max-w-[min(calc(100%-1rem),142px)] sm:max-lg:scale-[0.84]",
  "md:max-w-[min(100%,156px)] md:scale-[0.9]",
  "lg:max-w-[min(100%,172px)] lg:scale-100",
);

/**
 * Lightweight glass float cards around the hero showcase — presentation only.
 */
export function LandingHeroFloatingCards() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const cards = useMemo<FloatSpec[]>(
    () => [
      {
        id: "tip",
        valueKey: "landing.showcase.heroFloatTipValue",
        labelKey: "landing.showcase.heroFloatTipLabel",
        Icon: Coins,
        position: "top-[5.5%] left-[0.5%] sm:top-[7.5%] sm:left-[1.5%] lg:top-[10.5%] lg:left-[4.5%] lg:z-[31]",
        floatDuration: 7.5,
        floatDelay: 0,
      },
      {
        id: "review",
        valueKey: "landing.showcase.heroFloatReviewValue",
        labelKey: "landing.showcase.heroFloatReviewLabel",
        Icon: Star,
        position: "top-[8.5%] right-[2.5%] sm:top-[10%] sm:right-[3.5%] lg:top-[13%] lg:right-[5.5%] lg:z-[33]",
        floatDuration: 8.2,
        floatDelay: 0.6,
      },
      {
        id: "payout",
        valueKey: "landing.showcase.heroFloatPayoutValue",
        labelKey: "landing.showcase.heroFloatPayoutLabel",
        Icon: CheckCircle2,
        position: "bottom-[21%] left-[0.5%] sm:bottom-[20.5%] sm:left-[0.5%] lg:bottom-[23.5%] lg:left-[3.5%] lg:z-[30]",
        floatDuration: 7.8,
        floatDelay: 1.1,
      },
      {
        id: "staff",
        valueKey: "landing.showcase.heroFloatStaffValue",
        labelKey: "landing.showcase.heroFloatStaffLabel",
        Icon: Users,
        position: "bottom-[10%] right-[4%] sm:bottom-[11%] sm:right-[5%] lg:bottom-[12%] lg:right-[7%]",
        floatDuration: 8.5,
        floatDelay: 0.35,
      },
    ],
    [],
  );

  return (
    <div
      className="caretip-hero-float-cards pointer-events-none absolute inset-0 z-30 overflow-visible max-lg:overflow-visible lg:overflow-hidden"
      aria-hidden
    >
      {cards.map((card) => {
        const Icon = card.Icon;
        return (
          <motion.div
            key={card.id}
            className={cn(FLOAT_CARD_BASE, card.position)}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 1,
                    y:
                      card.id === "tip"
                        ? [0, -4, 0]
                        : card.id === "review"
                          ? [0, -6, 0]
                          : card.id === "payout"
                            ? [0, -5, 1]
                            : [0, -5, 0],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.45, delay: card.floatDelay * 0.15 }
                : {
                    opacity: { duration: 0.45, delay: card.floatDelay * 0.15 },
                    y: {
                      duration: card.floatDuration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: card.floatDelay,
                    },
                  }
            }
          >
            <div className="flex items-center gap-2 px-2.5 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5 lg:rounded-2xl">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15 sm:h-8 sm:w-8">
                <Icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <strong className="block font-sans text-[11px] font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-xs lg:text-sm">
                  {t(card.valueKey)}
                </strong>
                <span className="block text-[9px] leading-snug text-neutral-600 sm:text-[10px]">
                  {t(card.labelKey)}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
