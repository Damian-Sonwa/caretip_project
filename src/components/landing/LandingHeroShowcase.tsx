import type { ImgHTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  landingHeroEaseOut,
  landingHeroShowcaseFloat,
  landingHeroShowcaseFloatTransition,
} from "@/components/landing/landingHeroMotion";
import { landingUi } from "@/components/landing/landingUi";
import { useLargeScreen } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

type LandingHeroShowcaseProps = {
  src: string;
  alt: string;
  className?: string;
  /** Anchored on the product frame (moves with showcase float). */
  compositionOverlay?: ReactNode;
};

/** Premium hero showcase — entrance motion + optional desktop float; glows are static. */
export function LandingHeroShowcase({ src, alt, className, compositionOverlay }: LandingHeroShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const isLargeScreen = useLargeScreen();
  const enableFloat = !reduceMotion && isLargeScreen;

  return (
    <motion.div
      className={cn(landingUi.heroMediaShell, className)}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: landingHeroEaseOut }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-1/2 z-0 h-8 w-[78%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(120,113,105,0.2)_0%,rgba(120,113,105,0.06)_45%,transparent_72%)] blur-lg dark:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,transparent_70%)] max-lg:blur-md"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 0.28 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      />

      <div className={landingUi.heroShowcaseFrame}>
        <div
          aria-hidden
          className={cn(
            landingUi.heroShowcaseGlow,
            "blur-2xl opacity-[0.52] max-lg:blur-xl max-lg:opacity-40",
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 z-0 rounded-[36px] bg-[radial-gradient(circle_at_58%_36%,rgba(235,153,44,0.14)_0%,rgba(235,153,44,0.03)_42%,transparent_68%)] blur-xl opacity-50 max-lg:blur-lg max-lg:opacity-40"
        />

        <motion.div
          className="relative z-[1] h-full min-h-0 w-full max-lg:h-auto"
          animate={enableFloat ? landingHeroShowcaseFloat : undefined}
          transition={enableFloat ? landingHeroShowcaseFloatTransition : undefined}
        >
          <motion.div
            className={cn(landingUi.heroShowcaseCard, "h-full w-full")}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.994 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: landingHeroEaseOut, delay: 0.08 }}
          >
            <img
              src={src}
              alt={alt}
              className={landingUi.heroShowcaseImg}
              loading="eager"
              decoding="async"
              {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
            />
          </motion.div>
          {compositionOverlay}
        </motion.div>
      </div>
    </motion.div>
  );
}
