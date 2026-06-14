import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { LANDING_PARALLAX_PX } from "@/lib/landingMotion";
import { useMinWidthMedia } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

type LandingParallaxWrapProps = {
  children: ReactNode;
  className?: string;
};

/** Soft vertical parallax for showcase visuals — desktop only, max ~10px travel. */
export function LandingParallaxWrap({ children, className }: LandingParallaxWrapProps) {
  const reduceMotion = useReducedMotion();
  const isLgUp = useMinWidthMedia(1024);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [LANDING_PARALLAX_PX, -LANDING_PARALLAX_PX]);

  if (reduceMotion || !isLgUp) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ y }} className={cn(className)}>
      {children}
    </motion.div>
  );
}
