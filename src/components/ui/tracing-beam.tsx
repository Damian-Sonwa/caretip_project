"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Scroll-linked vertical accent (yellow → black) for long admin sections.
 */
export const TracingBeam = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 10%", "end 50%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 0.15, 1], [0.2, 0.6, 1]);

  // Plain `div` + explicit `position: relative` so `useScroll({ target })` always has a non-static
  // containing block (avoids framer-motion warn-once about scroll offset).
  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ position: "relative" }}>
      <div
        className="pointer-events-none absolute -left-3 top-0 bottom-0 hidden w-1 overflow-hidden rounded-full md:block md:-left-5"
        aria-hidden
      >
        <motion.div
          className="h-full w-full origin-top bg-gradient-to-b from-primary via-foreground/30 to-primary/20"
          style={{ scaleY }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
};
