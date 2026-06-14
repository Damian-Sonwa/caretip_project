import type { Transition, ViewportOptions } from "motion/react";

/** Premium SaaS easing — shared across landing scroll reveals. */
export const LANDING_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const landingMotionViewport: ViewportOptions = {
  once: true,
  amount: 0.15,
  margin: "0px 0px -5% 0px",
};

export const LANDING_REVEAL_DURATION_S = 0.58;
export const LANDING_STAGGER_S = 0.08;
export const LANDING_REVEAL_Y = 10;
export const LANDING_REVEAL_Y_MOBILE = 6;
export const LANDING_PARALLAX_PX = 10;

export function landingRevealTransition(delay = 0, duration = LANDING_REVEAL_DURATION_S): Transition {
  return { duration, delay, ease: LANDING_MOTION_EASE };
}

export function landingStaggerDelay(index: number, step = LANDING_STAGGER_S): number {
  return index * step;
}

/** Scroll reveal — fade + slight upward travel; reduced on mobile. */
export function landingScrollRevealProps(
  reduceMotion: boolean | null,
  options?: { delay?: number; isMobile?: boolean; duration?: number },
) {
  const delay = options?.delay ?? 0;
  const isMobile = options?.isMobile ?? false;
  const y = isMobile ? LANDING_REVEAL_Y_MOBILE : LANDING_REVEAL_Y;

  if (reduceMotion) {
    return { initial: false as const };
  }

  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: landingMotionViewport,
    transition: landingRevealTransition(delay, options?.duration ?? LANDING_REVEAL_DURATION_S),
  };
}
