import type { ReactNode } from "react";
import { LandingReveal } from "@/components/landing/LandingReveal";

type LandingScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "header" | "li" | "article";
};

/** Standard landing section entrance — CSS scroll reveal (no Framer Motion). */
export function LandingScrollReveal({
  children,
  className,
  delay = 0,
  as = "div",
}: LandingScrollRevealProps) {
  return (
    <LandingReveal as={as} className={className} delay={delay}>
      {children}
    </LandingReveal>
  );
}
