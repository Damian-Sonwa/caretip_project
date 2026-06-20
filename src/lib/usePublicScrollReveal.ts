import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const REVEAL_CLASS = "caretip-public-scroll-reveal";
const REVEAL_VISIBLE_CLASS = "caretip-public-scroll-reveal--visible";

/** Lightweight IO + CSS reveal for below-the-fold public content (no Framer Motion). */
export function usePublicScrollReveal(delayS = 0): {
  ref: RefObject<HTMLElement>;
  className: string;
  style: CSSProperties | undefined;
} {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion) {
      el.classList.add(REVEAL_VISIBLE_CLASS);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add(REVEAL_VISIBLE_CLASS);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return {
    ref,
    className: REVEAL_CLASS,
    style: delayS > 0 ? ({ ["--public-reveal-delay" as string]: `${delayS}s` } as CSSProperties) : undefined,
  };
}
