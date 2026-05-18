import type { ImgHTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  landingHeroEaseOut,
  landingHeroFloorShadowPulse,
  landingHeroFloorShadowTransition,
  landingHeroGlowDrift,
  landingHeroGlowDriftAlt,
  landingHeroGlowDriftAltTransition,
  landingHeroGlowDriftTransition,
  landingHeroShowcaseFloat,
  landingHeroShowcaseFloatTransition,
} from "@/components/landing/landingHeroMotion";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

type LandingHeroShowcaseProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Premium hero showcase — subtle float, layered glow, load-only entrance. */
export function LandingHeroShowcase({ src, alt, className }: LandingHeroShowcaseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(landingUi.heroMediaShell, className)}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: landingHeroEaseOut }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-1/2 z-0 h-8 w-[78%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(120,113,105,0.2)_0%,rgba(120,113,105,0.06)_45%,transparent_72%)] blur-xl dark:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,transparent_70%)]"
        animate={reduceMotion ? undefined : landingHeroFloorShadowPulse}
        transition={reduceMotion ? undefined : landingHeroFloorShadowTransition}
        style={{ willChange: "transform, opacity" }}
      />

      <div className={landingUi.heroShowcaseFrame}>
        <motion.div
          aria-hidden
          className={cn(landingUi.heroShowcaseGlow, "blur-3xl")}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, ...landingHeroGlowDrift }
          }
          transition={
            reduceMotion
              ? { duration: 0.9, ease: "easeOut", delay: 0.12 }
              : {
                  opacity: { duration: 0.9, ease: "easeOut", delay: 0.12 },
                  scale: landingHeroGlowDriftTransition,
                  x: landingHeroGlowDriftTransition,
                  y: landingHeroGlowDriftTransition,
                }
          }
          style={{ willChange: "transform, opacity" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-3 z-0 rounded-[36px] bg-[radial-gradient(circle_at_58%_36%,rgba(235,153,44,0.14)_0%,rgba(235,153,44,0.03)_42%,transparent_68%)] blur-2xl"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? { opacity: 0.55 } : { opacity: 0.55, ...landingHeroGlowDriftAlt }}
          transition={
            reduceMotion
              ? { duration: 1, ease: "easeOut", delay: 0.18 }
              : {
                  opacity: { duration: 1, ease: "easeOut", delay: 0.18 },
                  x: landingHeroGlowDriftAltTransition,
                  y: landingHeroGlowDriftAltTransition,
                }
          }
          style={{ willChange: "transform, opacity" }}
        />

        <motion.div
          className="relative z-[1]"
          animate={reduceMotion ? undefined : landingHeroShowcaseFloat}
          transition={reduceMotion ? undefined : landingHeroShowcaseFloatTransition}
          style={{ willChange: "transform" }}
        >
          <motion.div
            className={landingUi.heroShowcaseCard}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.992 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.82, ease: landingHeroEaseOut, delay: 0.1 }}
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
        </motion.div>
      </div>
    </motion.div>
  );
}
