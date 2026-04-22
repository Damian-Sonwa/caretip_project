import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { landingImageFrameClassName } from "@/components/ui/landing-image-frame";

export type FeatureCarouselImage = {
  src: string;
  alt: string;
  /** Kept for callers; slides always use a portrait frame with `object-cover`. */
  imageFit?: "cover" | "contain";
  /** Optional crop bias (e.g. `center 30%`). */
  objectPosition?: string;
};

export type FeatureCarouselProps = {
  images: FeatureCarouselImage[];
  className?: string;
  /** Auto-advance interval in ms (0 to disable). */
  autoPlayMs?: number;
};

type MaxBox = { w: number; h: number };

/** Shared portrait frame (height > width). Images use `object-cover` to fill full height. */
function useViewportMaxBox(): MaxBox {
  const readVw = React.useCallback((): number => {
    if (typeof window === "undefined") return 1024;
    return (
      window.visualViewport?.width ??
      document.documentElement?.clientWidth ??
      window.innerWidth
    );
  }, []);

  const computeBox = React.useCallback(
    (vw: number): MaxBox => {
      if (vw >= 768) return { w: 480, h: 720 };
      if (vw >= 640) return { w: 400, h: 600 };
      const w = Math.min(340, Math.max(220, vw - 48));
      /** Width-only bump on small screens; height matches tablet/desktop portrait band. */
      return { w, h: 530 };
    },
    []
  );

  const [box, setBox] = React.useState<MaxBox>(() => computeBox(readVw()));

  React.useEffect(() => {
    const read = () => {
      /**
       * Prefer viewport measurements that are stable across dev/prod.
       * `innerWidth` includes scrollbar width on desktop; that ~15px delta can
       * flip us across breakpoint thresholds (640/768) and change slide sizing.
       */
      const vw = readVw();
      setBox(computeBox(vw));
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, [computeBox, readVw]);

  return box;
}

export function FeatureCarousel({
  images,
  className,
  autoPlayMs = 4000,
}: FeatureCarouselProps) {
  const n = images.length;
  const [currentIndex, setCurrentIndex] = React.useState(() =>
    n > 0 ? Math.floor(n / 2) : 0
  );

  const maxBox = useViewportMaxBox();

  const handleNext = React.useCallback(() => {
    if (n === 0) return;
    setCurrentIndex((prev) => (prev + 1) % n);
  }, [n]);

  const handlePrev = React.useCallback(() => {
    if (n === 0) return;
    setCurrentIndex((prev) => (prev - 1 + n) % n);
  }, [n]);

  React.useEffect(() => {
    if (n <= 1 || autoPlayMs <= 0) return;
    const id = window.setInterval(() => handleNext(), autoPlayMs);
    return () => window.clearInterval(id);
  }, [handleNext, n, autoPlayMs]);

  const layoutByIndex = React.useMemo(() => {
    const out: Record<number, { w: number; h: number }> = {};
    for (let i = 0; i < images.length; i++) {
      /** One portrait card size for every slide; bitmap fills via `object-cover`. */
      out[i] = { w: maxBox.w, h: maxBox.h };
    }
    return out;
  }, [images.length, maxBox.h, maxBox.w]);

  const tallestSlide = React.useMemo(() => {
    let m = 400;
    for (let i = 0; i < n; i++) {
      const h = layoutByIndex[i]?.h ?? 0;
      if (h > m) m = h;
    }
    return m;
  }, [layoutByIndex, n]);

  if (n === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-x-hidden",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-25" aria-hidden>
        <div
          className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[380px] w-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle farthest-side, hsl(var(--primary) / 0.35), transparent)",
          }}
        />
        <div
          className="absolute bottom-0 right-[-20%] top-[-10%] h-[380px] w-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle farthest-side, hsl(182 41% 27% / 0.22), transparent)",
          }}
        />
      </div>

      <div
        className="relative z-10 flex w-full items-center justify-center py-0"
        style={{ minHeight: tallestSlide + 16 }}
      >
        <div className="relative flex h-full w-full max-w-full items-center justify-center [perspective:1000px]">
          {images.map((image, index) => {
            const offset = index - currentIndex;
            const total = images.length;
            let pos = (offset + total) % total;
            if (pos > Math.floor(total / 2)) {
              pos -= total;
            }

            const isCenter = pos === 0;
            const isAdjacent = Math.abs(pos) === 1;
            const size = layoutByIndex[index] ?? { w: maxBox.w, h: maxBox.h };
            const step = Math.max(size.w * 0.52, 120);

            return (
              <div
                key={`${image.src}-${index}`}
                className={cn(
                  landingImageFrameClassName,
                  "absolute flex bg-neutral-100 transition-[transform,opacity,filter,width,height] duration-500 ease-in-out",
                )}
                style={{
                  width: size.w,
                  height: size.h,
                  top: "50%",
                  left: "50%",
                  marginLeft: -size.w / 2,
                  marginTop: -size.h / 2,
                  transform: `
                        translateX(${pos * step}px)
                        scale(${isCenter ? 1 : isAdjacent ? 0.85 : 0.7})
                        rotateY(${pos * -10}deg)
                      `,
                  zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                  opacity: isCenter ? 1 : isAdjacent ? 0.4 : 0,
                  filter: isCenter ? "blur(0px)" : "blur(4px)",
                  visibility: Math.abs(pos) > 1 ? "hidden" : "visible",
                }}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="block h-full w-full object-cover object-center"
                  style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
                />
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-primary/25 bg-background/60 backdrop-blur-sm hover:bg-muted/80 sm:left-4"
          onClick={handlePrev}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-primary/25 bg-background/60 backdrop-blur-sm hover:bg-muted/80 sm:right-4"
          onClick={handleNext}
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
