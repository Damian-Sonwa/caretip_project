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

/** Premium hero showcase — one entrance pass; static glows (no infinite float on desktop). */
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
        className="pointer-events-none absolute -bottom-3 left-1/2 z-0 h-8 w-[78%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(120,113,105,0.2)_0%,rgba(120,113,105,0.06)_45%,transparent_72%)] blur-lg opacity-[0.28] dark:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,transparent_70%)] max-lg:blur-md lg:hidden"
      />

      <div className={cn(landingUi.heroShowcaseFrame, "caretip-hero-showcase-frame-depth")}>
        <div
          aria-hidden
          className={cn(
            landingUi.heroShowcaseGlow,
            "caretip-hero-showcase-glow blur-2xl opacity-[0.52] max-lg:blur-xl max-lg:opacity-40 lg:blur-xl lg:opacity-45",
          )}
        />
        <div aria-hidden className="caretip-hero-showcase-card-glow" />
        <motion.div
          className={landingUi.heroShowcaseStack}
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
          <div className={cn(landingUi.heroShowcaseCard, "caretip-hero-showcase-card--depth relative h-full w-full")}>
            <div aria-hidden className="caretip-hero-showcase-edge-glow rounded-[inherit]" />
            <div className={cn(landingUi.heroShowcaseCardMedia, "relative")}>
              <div aria-hidden className="caretip-hero-showcase-light-overlay pointer-events-none absolute inset-0 z-[1]" />
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
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
