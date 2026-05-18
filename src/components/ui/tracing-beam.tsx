"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Static vertical accent for long dashboard sections (no scroll listener — GPU-friendly).
 */
export const TracingBeam = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="pointer-events-none absolute -left-3 top-0 bottom-0 hidden w-1 overflow-hidden rounded-full md:block md:-left-5"
        aria-hidden
      >
        <div className="h-full w-full origin-top bg-gradient-to-b from-primary via-foreground/30 to-primary/20" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
};
