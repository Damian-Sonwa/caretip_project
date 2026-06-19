import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { useReducedMotion } from "motion/react";

import { LandingHeroFloatingCards } from "@/components/landing/LandingHeroFloatingCards";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

import storyHero01 from "../../../images/story-hero01.png";
import storyHero02 from "../../../images/story-hero02.png";

const STORY_FRAMES = [
  { src: storyHero01, key: "story-hero01" },
  { src: storyHero02, key: "story-hero02" },
] as const;

const STORY_CYCLE_MS = 5600;

type LandingHeroStoryShowcaseProps = {
  alt: string;
  className?: string;
};

/**
 * Hero story frames — slow crossfade (not horizontal marquee).
 * Images are direct children of `.caretip-hero-media-clip` so sizing matches the single-image hero.
 */
export function LandingHeroStoryShowcase({ alt, className }: LandingHeroStoryShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % STORY_FRAMES.length);
    }, STORY_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className={cn("caretip-hero-story-showcase-root", className)}>
      <div className={cn(landingUi.heroMediaShell, "caretip-hero-showcase-composition")}>
        <div
          aria-hidden
          className="caretip-hero-showcase-ambient pointer-events-none absolute inset-0 -z-[1]"
        />

        <div className={landingUi.heroMediaWrap}>
          <div className={landingUi.heroMediaClip}>
            {(reduceMotion ? STORY_FRAMES.slice(0, 1) : STORY_FRAMES).map((frame, index) => {
              const isActive = index === activeIndex;
              return (
                <img
                  key={frame.key}
                  src={frame.src}
                  alt={isActive ? alt : ""}
                  aria-hidden={!isActive}
                  className={cn(
                    landingUi.heroShowcaseImg,
                    "caretip-hero-story-frame",
                    isActive && "caretip-hero-story-frame--active",
                  )}
                  loading="eager"
                  decoding="async"
                  sizes="(max-width: 1023px) min(90vw, 448px), 672px"
                  {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
                />
              );
            })}
          </div>
        </div>

        <div className={cn(landingUi.heroFloatLayer, "caretip-hero-float-layer--on-art")}>
          <LandingHeroFloatingCards />
        </div>
      </div>
    </div>
  );
}
