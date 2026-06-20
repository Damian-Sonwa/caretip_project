import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingParallaxWrapProps = {
  children: ReactNode;
  className?: string;
};

/** Showcase visual wrapper — parallax removed (was Framer Motion scroll-linked). */
export function LandingParallaxWrap({ children, className }: LandingParallaxWrapProps) {
  return <div className={cn(className)}>{children}</div>;
}
