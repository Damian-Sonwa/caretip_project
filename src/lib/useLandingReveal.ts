import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const REVEAL_CLASS = "caretip-landing-scroll-reveal";
const REVEAL_VISIBLE_CLASS = "caretip-landing-scroll-reveal--visible";

/** IntersectionObserver scroll reveal — CSS transitions, no Framer Motion. */
export function useLandingReveal(delayS = 0): {
  ref: RefObject<HTMLDivElement>;
  className: string;
  style: CSSProperties | undefined;
} {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion) {
      el.classList.add(REVEAL_VISIBLE_CLASS);
      return;
    }

    const markVisibleIfInView = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.92 && rect.bottom > vh * 0.05) {
        el.classList.add(REVEAL_VISIBLE_CLASS);
        return true;
      }
      return false;
    };

    if (markVisibleIfInView()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add(REVEAL_VISIBLE_CLASS);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -2% 0px", threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return {
    ref,
    className: REVEAL_CLASS,
    style: delayS > 0 ? ({ ["--reveal-delay" as string]: `${delayS}s` } as CSSProperties) : undefined,
  };
}
