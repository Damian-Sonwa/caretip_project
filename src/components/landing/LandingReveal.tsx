import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { useLandingReveal } from "@/lib/useLandingReveal";
import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
  as?: ElementType;
} & HTMLAttributes<HTMLElement>;

/** Scroll-triggered fade + rise — CSS only (see caretip-landing-motion.css). */
export function LandingReveal({
  children,
  className,
  delay = 0,
  style,
  as: Tag = "div",
  ...rest
}: LandingRevealProps) {
  const reveal = useLandingReveal(delay);

  return (
    <Tag
      ref={reveal.ref}
      className={cn(reveal.className, className)}
      style={{ ...reveal.style, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
