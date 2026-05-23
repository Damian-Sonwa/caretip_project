import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { landingHeroEaseOut } from "@/components/landing/landingHeroMotion";
import { cn } from "@/lib/utils";

const ROTATE_MS = 2800;
const LINE_HEIGHT = "1.12em";
const MOBILE_ROTATING_MQ = "(max-width: 639px)";

type LandingHeroAnimatedWordProps = {
  words: string[];
  className?: string;
};

/**
 * Premium hero keyword — vertical word reel with smooth slide (Framer-style).
 * On narrow viewports, width tracks the active word only so long rotation
 * candidates do not leave the suffix visually isolated on the next line.
 */
export function LandingHeroAnimatedWord({ words, className }: LandingHeroAnimatedWordProps) {
  const reduceMotion = useReducedMotion();
  const safeWords = useMemo(() => words.filter(Boolean), [words]);
  const [index, setIndex] = useState(0);
  const [compactWidth, setCompactWidth] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [activeWidth, setActiveWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_ROTATING_MQ);
    const sync = () => setCompactWidth(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || safeWords.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeWords.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, safeWords.length]);

  const activeIndex = reduceMotion ? 0 : index % safeWords.length;
  const activeWord = safeWords[activeIndex] ?? safeWords[0];

  useLayoutEffect(() => {
    if (!compactWidth || !measureRef.current) {
      setActiveWidth(undefined);
      return;
    }
    const measure = () => {
      if (measureRef.current) {
        setActiveWidth(Math.ceil(measureRef.current.getBoundingClientRect().width));
      }
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(measureRef.current);
    return () => ro?.disconnect();
  }, [compactWidth, activeWord, className]);

  if (!safeWords.length) return null;

  if (reduceMotion || safeWords.length <= 1) {
    return (
      <span className={cn("caretip-hero-animated-word inline whitespace-nowrap", className)}>
        {safeWords[0]}
      </span>
    );
  }

  if (compactWidth) {
    return (
      <span
        className={cn(
          "caretip-hero-animated-word caretip-hero-animated-word--compact inline align-baseline",
          className,
        )}
        aria-live="polite"
      >
        <span
          ref={measureRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-0 whitespace-nowrap opacity-0",
            className,
          )}
        >
          {activeWord}
        </span>
        <span
          className="caretip-hero-animated-word__viewport inline-block overflow-hidden align-bottom"
          style={{
            height: LINE_HEIGHT,
            width: activeWidth,
            maxWidth: "100%",
            verticalAlign: "baseline",
          }}
        >
          <motion.span
            className="flex flex-col items-start will-change-transform"
            animate={{ y: `calc(${-activeIndex} * ${LINE_HEIGHT})` }}
            transition={{ duration: 0.62, ease: landingHeroEaseOut }}
          >
            {safeWords.map((word) => (
              <span
                key={word}
                className={cn("flex shrink-0 items-center whitespace-nowrap", className)}
                style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}
              >
                {word}
              </span>
            ))}
          </motion.span>
        </span>
      </span>
    );
  }

  return (
    <span
      className="caretip-hero-animated-word inline-grid align-baseline [grid-template-columns:minmax(0,max-content)]"
      aria-live="polite"
    >
      {safeWords.map((word) => (
        <span
          key={`measure-${word}`}
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none select-none",
            className,
          )}
        >
          {word}
        </span>
      ))}

      <span
        className="caretip-hero-animated-word__viewport col-start-1 row-start-1 inline-block overflow-hidden align-bottom"
        style={{ height: LINE_HEIGHT }}
      >
        <motion.span
          className="flex flex-col items-start will-change-transform"
          animate={{ y: `calc(${-activeIndex} * ${LINE_HEIGHT})` }}
          transition={{ duration: 0.62, ease: landingHeroEaseOut }}
        >
          {safeWords.map((word) => (
            <span
              key={word}
              className={cn("flex shrink-0 items-center whitespace-nowrap", className)}
              style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}
            >
              {word}
            </span>
          ))}
        </motion.span>
      </span>
    </span>
  );
}
