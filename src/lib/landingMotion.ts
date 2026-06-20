/** Premium SaaS easing — shared across landing scroll reveals. */
export const LANDING_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const LANDING_REVEAL_DURATION_S = 0.58;
export const LANDING_STAGGER_S = 0.08;
export const LANDING_REVEAL_Y = 10;
export const LANDING_REVEAL_Y_MOBILE = 6;
export const LANDING_PARALLAX_PX = 10;

export function landingStaggerDelay(index: number, step = LANDING_STAGGER_S): number {
  return index * step;
}
