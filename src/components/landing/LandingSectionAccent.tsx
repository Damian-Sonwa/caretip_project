import type { ReactNode } from "react";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

export type LandingAccentVariant = "trend" | "spark" | "arrow" | "line";

type LandingSectionAccentProps = {
  children: ReactNode;
  variant?: LandingAccentVariant;
  /** Softer copy-only accent (no icon glow). */
  muted?: boolean;
  className?: string;
};

export function LandingSectionAccent({
  children,
  variant = "trend",
  muted = false,
  className,
}: LandingSectionAccentProps) {
  const Icon =
    variant === "spark" ? Sparkles : variant === "arrow" ? ArrowUpRight : TrendingUp;

  return (
    <span
      className={cn(landingUi.sectionAccent, className)}
      data-landing-accent=""
      role="presentation"
    >
      {!muted ? (
        <span aria-hidden className={landingUi.sectionAccentGlow} data-accent-glow="" />
      ) : null}
      {variant === "line" && !muted ? (
        <span aria-hidden className={landingUi.sectionAccentLine} />
      ) : null}
      {!muted && variant !== "line" ? (
        <Icon className={landingUi.sectionAccentIcon} strokeWidth={2.25} aria-hidden />
      ) : null}
      {muted && variant === "arrow" ? (
        <ArrowUpRight className={landingUi.sectionAccentIconMuted} strokeWidth={2} aria-hidden />
      ) : null}
      <span className={muted ? landingUi.sectionAccentTextMuted : landingUi.sectionAccentText}>
        {children}
      </span>
    </span>
  );
}
