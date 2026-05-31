import type { ImgHTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";

import { landingHeroEaseOut, landingHeroShowcaseEnter } from "@/components/landing/landingHeroMotion";
import { landingUi } from "@/components/landing/landingUi";
import { useLargeScreen } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

type LandingHeroShowcaseProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Hero artwork — wrap (shadow) + clip (radius) + image; decorative layers outside clip. */
export function LandingHeroShowcase({ src, alt, className }: LandingHeroShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const isLargeScreen = useLargeScreen();
  const useLightEnter = reduceMotion || isLargeScreen;

  return (
    <motion.div
      className={cn(landingUi.heroMediaShell, "caretip-hero-showcase-composition", className)}
      initial={reduceMotion || isLargeScreen ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: landingHeroEaseOut }}
    >
      <div
        aria-hidden
        className="caretip-hero-showcase-ambient pointer-events-none absolute inset-0 -z-[1]"
      />

      <motion.div
        className={landingUi.heroMediaWrap}
        variants={useLightEnter ? landingHeroShowcaseEnter : undefined}
        initial={
          reduceMotion
            ? false
            : useLightEnter
              ? "hidden"
              : { opacity: 0, scale: 0.994 }
        }
        animate={reduceMotion ? false : useLightEnter ? "visible" : { opacity: 1, scale: 1 }}
        transition={
          useLightEnter || reduceMotion
            ? undefined
            : { duration: 0.5, ease: landingHeroEaseOut, delay: 0.08 }
        }
      >
        <div className={landingUi.heroMediaClip}>
          <img
            src={src}
            alt={alt}
            className={landingUi.heroShowcaseImg}
            loading="eager"
            decoding="async"
            sizes="(max-width: 1023px) min(90vw, 448px), 672px"
            {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
