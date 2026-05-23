import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { landingHeroEaseOut } from "@/components/landing/landingHeroMotion";
import { cn } from "@/lib/utils";

const ROTATE_MS = 2800;
/** Matches hero headline rhythm; slot height is fixed so transitions never reflow. */
const SLOT_LINE_HEIGHT = "1.12em";

type LandingHeroAnimatedWordProps = {
  words: string[];
  className?: string;
};

/**
 * Premium hero keyword — vertical word reel with a fixed slot sized to the
 * longest candidate so width/height never change during transitions.
 */
export function LandingHeroAnimatedWord({ words, className }: LandingHeroAnimatedWordProps) {
  const reduceMotion = useReducedMotion();
  const safeWords = useMemo(() => words.filter(Boolean), [words]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || safeWords.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeWords.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, safeWords.length]);

  const activeIndex = reduceMotion ? 0 : index % safeWords.length;

  if (!safeWords.length) return null;

  if (reduceMotion || safeWords.length <= 1) {
    return (
      <span
        className={cn(
          "caretip-hero-animated-word caretip-hero-animated-word--static inline-block whitespace-nowrap",
          className,
        )}
        style={{ minHeight: SLOT_LINE_HEIGHT, lineHeight: SLOT_LINE_HEIGHT }}
      >
        {safeWords[0]}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "caretip-hero-animated-word inline-grid align-top [grid-template-columns:minmax(0,max-content)]",
        className,
      )}
      style={{ minHeight: SLOT_LINE_HEIGHT }}
      aria-live="polite"
    >
      {safeWords.map((word) => (
        <span
          key={`measure-${word}`}
          data-measure-word
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none select-none",
            className,
          )}
          style={{ height: SLOT_LINE_HEIGHT, lineHeight: SLOT_LINE_HEIGHT }}
        >
          {word}
        </span>
      ))}

      <span
        className="caretip-hero-animated-word__viewport col-start-1 row-start-1 inline-block overflow-hidden align-top"
        style={{ height: SLOT_LINE_HEIGHT, minHeight: SLOT_LINE_HEIGHT }}
      >
        <motion.span
          className="flex flex-col items-start will-change-transform"
          animate={{ y: `calc(${-activeIndex} * ${SLOT_LINE_HEIGHT})` }}
          transition={{ duration: 0.62, ease: landingHeroEaseOut }}
        >
          {safeWords.map((word) => (
            <span
              key={word}
              className={cn("flex shrink-0 items-center whitespace-nowrap", className)}
              style={{ height: SLOT_LINE_HEIGHT, lineHeight: SLOT_LINE_HEIGHT }}
            >
              {word}
            </span>
          ))}
        </motion.span>
      </span>
    </span>
  );
}
