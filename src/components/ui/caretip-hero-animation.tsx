"use client";

import { Player } from "@remotion/player";
import { SpatialPush } from "@/app/components/ui/spatial-push";
import { memo, useState, useEffect } from "react";
import heroTapToTip from "../../../images/caretip-image.png";
import heroTeamMotivation from "../../../images/cafe-employee.png";
import heroBusinessImpact from "../../../images/new-hero.png";

/**
 * Responsive portrait frame sizing (matches FeatureCarousel)
 */
function useViewportMaxBox(): { w: number; h: number } {
  const computeBox = (vw: number): { w: number; h: number } => {
    if (vw >= 768) return { w: 480, h: 720 };
    if (vw >= 640) return { w: 400, h: 600 };
    const w = Math.min(340, Math.max(220, vw - 48));
    return { w, h: 530 };
  };

  const [box, setBox] = useState<{ w: number; h: number }>(() => {
    if (typeof window === "undefined") return { w: 480, h: 720 };
    const vw =
      window.visualViewport?.width ??
      document.documentElement?.clientWidth ??
      window.innerWidth;
    return computeBox(vw);
  });

  useEffect(() => {
    const read = () => {
      const vw =
        window.visualViewport?.width ??
        document.documentElement?.clientWidth ??
        window.innerWidth;
      setBox(computeBox(vw));
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, []);

  return box;
}

interface CareTipHeroSceneProps {
  width: number;
  height: number;
  currentIndex: number;
}

/**
 * CareTip Hero Animation Scene
 * Displays animated transition between all three hero images
 */
const CareTipHeroScene = memo(({ width, height, currentIndex }: CareTipHeroSceneProps) => {
  const images = [heroTapToTip, heroTeamMotivation, heroBusinessImpact];
  const alts = ["Tap to Tip", "Team Motivation", "Business Impact"];
  
  const fromIdx = currentIndex;
  const toIdx = (currentIndex + 1) % images.length;

  return (
    <SpatialPush
      from={
        <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={images[fromIdx]} alt={alts[fromIdx]} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        </div>
      }
      to={
        <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={images[toIdx]} alt={alts[toIdx]} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        </div>
      }
      direction="up"
    />
  );
});

CareTipHeroScene.displayName = "CareTipHeroScene";

export interface CareTipHeroAnimationProps {
  className?: string;
}

/**
 * CareTip Hero Animation Player Component
 * Production-ready component for embedding in the landing page hero section
 * Restores original responsive sizing with all 3 hero images and decorative overlays
 */
export function CareTipHeroAnimation({ className = "" }: CareTipHeroAnimationProps) {
  const maxBox = useViewportMaxBox();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tallestSlide, setTallestSlide] = useState(maxBox.h);

  useEffect(() => {
    // Cycle through images one after the other
    // Animation duration: 240 frames at 30fps = 8 seconds per animation
    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setTallestSlide(maxBox.h);
  }, [maxBox.h]);

  return (
    <div className={`relative w-full flex flex-col items-center justify-center overflow-x-hidden ${className}`} style={{ minHeight: tallestSlide + 16 }}>
      {/* Decorative gradient overlays (from FeatureCarousel) */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-25" aria-hidden>
        <div
          className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[380px] w-[380px] rounded-full"
          style={{
            background: "radial-gradient(circle farthest-side, hsl(var(--primary) / 0.35), transparent)",
          }}
        />
        <div
          className="absolute bottom-0 right-[-20%] top-[-10%] h-[380px] w-[380px] rounded-full"
          style={{
            background: "radial-gradient(circle farthest-side, hsl(182 41% 27% / 0.22), transparent)",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center py-0" style={{ minHeight: tallestSlide + 16 }}>
        <Player
          component={CareTipHeroScene}
          compositionWidth={maxBox.w}
          compositionHeight={maxBox.h}
          durationInFrames={240}
          fps={30}
          style={{
            width: maxBox.w,
            height: maxBox.h,
          }}
          inputProps={{ width: maxBox.w, height: maxBox.h, currentIndex }}
          controls={false}
          autoPlay
          loop
          clickToPlay={false}
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
}

export default CareTipHeroAnimation;
