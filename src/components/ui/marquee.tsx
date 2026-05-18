import * as React from "react";

import { useInViewActive } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

export type MarqueeProps = {
  className?: string;
  /** Seconds (e.g. 24). */
  durationSeconds?: number;
  /** Pixel gap between items (e.g. 24). */
  gapPx?: number;
  pauseOnHover?: boolean;
  children: React.ReactNode;
};

/**
 * Lightweight marquee (Tailwind 4 + keyframes in `src/styles/tailwind.css`).
 * Duplicates children once for a seamless loop. Pauses when off-screen.
 */
export function Marquee({
  className,
  durationSeconds = 28,
  gapPx = 24,
  pauseOnHover = false,
  children,
}: MarqueeProps) {
  const { ref, active } = useInViewActive<HTMLDivElement>();
  const inner = (
    <div className="flex min-w-full shrink-0 items-stretch" style={{ gap: `${gapPx}px` }}>
      {children}
    </div>
  );

  return (
    <div
      ref={ref}
      className={cn("group flex w-full overflow-hidden [--gap:24px] [--duration:28s]", className)}
      style={
        {
          ["--gap" as string]: `${gapPx}px`,
          ["--duration" as string]: `${durationSeconds}s`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex min-w-full flex-none animate-marquee items-stretch",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          !active && "[animation-play-state:paused]",
        )}
        style={{ gap: `${gapPx}px` }}
      >
        {inner}
        {inner}
      </div>
    </div>
  );
}
