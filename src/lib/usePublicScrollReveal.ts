import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { isNearViewport, PUBLIC_DEFER_ROOT_MARGIN } from "./publicRouteDefer";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const REVEAL_CLASS = "caretip-public-scroll-reveal";
const REVEAL_VISIBLE_CLASS = "caretip-public-scroll-reveal--visible";

/** Lightweight IO + CSS reveal for below-the-fold public content (no Framer Motion). */
export function usePublicScrollReveal<T extends HTMLElement = HTMLElement>(delayS = 0): {
  ref: RefObject<T>;
  className: string;
  style: CSSProperties | undefined;
} {
  const ref = useRef<T>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => {
      el.classList.add(REVEAL_VISIBLE_CLASS);
    };

    if (reduceMotion) {
      show();
      return;
    }

    if (isNearViewport(el, PUBLIC_DEFER_ROOT_MARGIN)) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px 12% 0px", threshold: 0.01 },
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
