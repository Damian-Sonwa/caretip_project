import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

import { LandingHeroFloatingCards } from "@/components/landing/LandingHeroFloatingCards";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

import storyHero01Png from "../../../images/story-hero01.png";
import storyHero01Webp from "../../../images/story-hero01.webp";
import storyHero01Avif from "../../../images/story-hero01.avif";
import storyHero02Png from "../../../images/story-hero02.png";
import storyHero02Webp from "../../../images/story-hero02.webp";
import storyHero02Avif from "../../../images/story-hero02.avif";

const STORY_FRAMES = [
  { key: "story-hero01", png: storyHero01Png, webp: storyHero01Webp, avif: storyHero01Avif },
  { key: "story-hero02", png: storyHero02Png, webp: storyHero02Webp, avif: storyHero02Avif },
] as const;

const STORY_CYCLE_MS = 5600;
const HERO_IMAGE_SIZES = "(max-width: 1023px) min(90vw, 448px), 672px";

function preloadHeroFrame(frame: (typeof STORY_FRAMES)[number]) {
  const img = new Image();
  img.src = frame.avif;
  img.onerror = () => {
    const fallback = new Image();
    fallback.src = frame.webp;
    fallback.onerror = () => {
      const png = new Image();
      png.src = frame.png;
    };
  };
}

type LandingHeroStoryShowcaseProps = {
  alt: string;
  className?: string;
};

/**
 * Hero story frames — slow crossfade (not horizontal marquee).
 * Images are direct children of `.caretip-hero-media-clip` (via `display: contents` on picture).
 */
export function LandingHeroStoryShowcase({ alt, className }: LandingHeroStoryShowcaseProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [frameReady, setFrameReady] = useState<Record<string, boolean>>({});

  useEffect(() => {
    preloadHeroFrame(STORY_FRAMES[1]);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % STORY_FRAMES.length);
    }, STORY_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const frames = reduceMotion ? STORY_FRAMES.slice(0, 1) : STORY_FRAMES;

  return (
    <div className={cn("caretip-hero-story-showcase-root", className)}>
      <div className={cn(landingUi.heroMediaShell, "caretip-hero-showcase-composition")}>
        <div
          aria-hidden
          className="caretip-hero-showcase-ambient pointer-events-none absolute inset-0 -z-[1]"
        />

        <div className={landingUi.heroMediaWrap}>
          <div className={landingUi.heroMediaClip}>
            {frames.map((frame, index) => {
              const isActive = index === activeIndex;
              const isReady = frameReady[frame.key] ?? index === 0;
              return (
                <picture key={frame.key} className="contents">
                  <source type="image/avif" srcSet={frame.avif} />
                  <source type="image/webp" srcSet={frame.webp} />
                  <img
                    src={frame.png}
                    alt={isActive ? alt : ""}
                    aria-hidden={!isActive}
                    className={cn(
                      landingUi.heroShowcaseImg,
                      "caretip-hero-story-frame",
                      "caretip-marketing-img",
                      isReady && "caretip-marketing-img--ready",
                      isActive && "caretip-hero-story-frame--active",
                    )}
                    loading={index === 0 ? "eager" : "eager"}
                    decoding="async"
                    sizes={HERO_IMAGE_SIZES}
                    onLoad={() => setFrameReady((prev) => ({ ...prev, [frame.key]: true }))}
                    {...(index === 0
                      ? ({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)
                      : ({ fetchpriority: "low" } as ImgHTMLAttributes<HTMLImageElement>))}
                  />
                </picture>
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
