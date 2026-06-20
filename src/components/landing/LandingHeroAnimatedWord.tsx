import { useEffect, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4200;
const SLOT_LINE_HEIGHT = "1em";

type LandingHeroAnimatedWordProps = {
  words: string[];
  className?: string;
};

/** Premium hero keyword reel — CSS transitions only (no Framer Motion). */
export function LandingHeroAnimatedWord({ words, className }: LandingHeroAnimatedWordProps) {
  const reduceMotion = usePrefersReducedMotion();
  const safeWords = useMemo(() => words.filter(Boolean), [words]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [safeWords]);

  useEffect(() => {
    if (reduceMotion || safeWords.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeWords.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, safeWords.length]);

  const activeIndex = reduceMotion ? 0 : index % safeWords.length;
  const activeWord = safeWords[activeIndex];

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
          className="col-start-1 row-start-1 whitespace-nowrap opacity-0 pointer-events-none select-none font-inherit font-extrabold"
          style={{ height: SLOT_LINE_HEIGHT, lineHeight: SLOT_LINE_HEIGHT }}
        >
          {word}
        </span>
      ))}

      <span
        className="caretip-hero-animated-word__viewport relative col-start-1 row-start-1 inline-block overflow-hidden align-top"
        style={{ height: SLOT_LINE_HEIGHT, minHeight: SLOT_LINE_HEIGHT }}
      >
        <span
          key={`${activeIndex}-${activeWord}`}
          data-reel-word
          className={cn(
            "caretip-hero-animated-word__slide caretip-hero-animated-word__slide--enter absolute inset-x-0 flex items-center whitespace-nowrap",
            className,
          )}
          style={{ height: SLOT_LINE_HEIGHT, lineHeight: SLOT_LINE_HEIGHT }}
        >
          {activeWord}
        </span>
      </span>
    </span>
  );
}
