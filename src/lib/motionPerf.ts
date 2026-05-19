import * as React from "react";

/** Shared viewport for landing scroll reveals — once, lightweight. */
export const landingSectionViewport = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -6% 0px",
} as const;

export const landingSectionReveal = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

/** Opacity-only scroll reveal — avoids translate jitter on mobile. */
export const landingFadeReveal = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: landingSectionViewport,
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
} as const;

export function landingFadeRevealWithDelay(delay = 0) {
  return {
    ...landingFadeReveal,
    transition: { ...landingFadeReveal.transition, delay },
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
