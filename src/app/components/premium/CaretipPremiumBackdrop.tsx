import { cn } from "@/lib/utils";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";
import { heroPersonalityBackdropClass } from "@/lib/heroPersonalitySystem";

type CaretipPremiumBackdropProps = {
  className?: string;
  /** Section personality — adjusts atmosphere radial accents only; base gradient unchanged. */
  personality?: HeroPersonality;
};

/**
 * Exact Final CTA layer stack — atmosphere, texture, noise.
 * Shared by landing Final CTA and dashboard premium heroes.
 */
export function CaretipPremiumBackdrop({ className, personality }: CaretipPremiumBackdropProps) {
  return (
    <div
      className={cn(
        "caretip-premium-backdrop pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "caretip-premium-backdrop__atmosphere absolute inset-0",
          personality ? heroPersonalityBackdropClass(personality) : null,
        )}
      />
      <div className="caretip-premium-backdrop__texture absolute inset-0" />
      <div className="caretip-premium-backdrop__noise absolute inset-0" />
    </div>
  );
}
