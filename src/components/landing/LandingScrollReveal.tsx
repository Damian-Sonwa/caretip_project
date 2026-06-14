import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { landingScrollRevealProps } from "@/lib/landingMotion";
import { useMinWidthMedia } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

type LandingScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "header" | "li" | "article";
};

/** Standard landing section entrance — fade + subtle rise, once per viewport. */
export function LandingScrollReveal({
  children,
  className,
  delay = 0,
  as = "div",
}: LandingScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const isLgUp = useMinWidthMedia(1024);
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn(className)}
      {...landingScrollRevealProps(reduceMotion, { delay, isMobile: !isLgUp })}
    >
      {children}
    </MotionTag>
  );
}
