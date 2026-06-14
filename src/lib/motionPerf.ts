import * as React from "react";
import {
  LANDING_REVEAL_DURATION_S,
  LANDING_REVEAL_Y,
  LANDING_REVEAL_Y_MOBILE,
  landingMotionViewport,
  landingRevealTransition,
} from "./landingMotion";

/** Shared viewport for landing scroll reveals — once, lightweight. */
export const landingSectionViewport = landingMotionViewport;

export const landingSectionReveal = {
  hidden: { opacity: 0, y: LANDING_REVEAL_Y_MOBILE },
  visible: {
    opacity: 1,
    y: 0,
    transition: landingRevealTransition(0, LANDING_REVEAL_DURATION_S),
  },
} as const;

/** Scroll reveal — fade + subtle rise (mobile uses smaller travel). */
export const landingFadeReveal = {
  initial: { opacity: 0, y: LANDING_REVEAL_Y },
  whileInView: { opacity: 1, y: 0 },
  viewport: landingSectionViewport,
  transition: landingRevealTransition(0, LANDING_REVEAL_DURATION_S),
} as const;

export function landingFadeRevealWithDelay(delay = 0) {
  return {
    ...landingFadeReveal,
    transition: landingRevealTransition(delay, LANDING_REVEAL_DURATION_S),
  };
}

/** Dashboard block entrance — opacity-first, minimal travel. */
export const dashboardBlockMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
} as const;

/** Pause timers / CSS loops when off-screen. */
export function useInViewActive<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = React.useRef<T | null>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry?.intersectionRatio ?? 0;
        setActive(entry.isIntersecting && ratio >= 0.08);
      },
      { root: null, rootMargin: "48px 0px", threshold: [0, 0.08, 0.2], ...options },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, active };
}

export function useLargeScreen(minWidth = 1024) {
  const [matches, setMatches] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(min-width: ${minWidth}px)`).matches : true,
  );

  React.useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [minWidth]);

  return matches;
}

/** SSR-safe viewport gate — false below `minWidth` (no DOM for desktop-only UI on mobile). */
export function useMinWidthMedia(minWidth = 1024) {
  const query = `(min-width: ${minWidth}px)`;
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
