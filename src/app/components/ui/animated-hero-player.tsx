"use client";

import { Player } from "@remotion/player";
import { SpatialPush } from "./spatial-push";
import { memo } from "react";

// Scene component that renders the animation
const HeroScene = memo(() => {
  return <SpatialPush />;
});

HeroScene.displayName = "HeroScene";

export interface AnimatedHeroProps {
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Premium animated hero component using Remotion
 * Displays a spatial push animation that transitions smoothly
 * between scenes with spring physics
 */
export function AnimatedHeroPlayer({
  autoPlay = true,
  loop = true,
  controls = false,
  width = 1280,
  height = 720,
  className = "",
}: AnimatedHeroProps) {
  return (
    <div
      className={`w-full overflow-hidden bg-background ${className}`}
      style={{
        aspectRatio: `${width} / ${height}`,
        maxHeight: "100vh",
      }}
    >
      <Player
        component={HeroScene}
        durationInFrames={120}
        fps={30}
        compositionWidth={width}
        compositionHeight={height}
        style={{
          width: "100%",
          height: "100%",
        }}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        clickToPlay={false}
        acknowledgeRemotionLicense
      />
    </div>
  );
}

export default AnimatedHeroPlayer;
