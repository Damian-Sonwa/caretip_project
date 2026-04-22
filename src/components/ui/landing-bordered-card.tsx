import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

/** CareTip marketing: orange → black beam only. */
export const LANDING_BRAND_BEAM_FROM = "#EB992C";
export const LANDING_BRAND_BEAM_TO = "#000000";

type LandingBorderedCardProps = {
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
  /** Stagger animated border (seconds) per card in a grid */
  beamDelay?: number;
  /** Disable the moving border-beam animation for this card. */
  showBeam?: boolean;
};

/**
 * shadcn Card + BorderBeam for landing sections. Keeps copy on `bg-card` with
 * high-contrast foreground tokens.
 */
export function LandingBorderedCard({
  children,
  className,
  cardClassName,
  beamDelay = 0,
  showBeam = true,
}: LandingBorderedCardProps) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Card
        className={cn(
          // Landing cards: subtle off-white surface + thin border + soft depth (Stripe/Linear feel).
          // Keep tokens for text; lock surface to avoid random gray drift across sections.
          "relative h-full overflow-hidden rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]",
          cardClassName,
        )}
      >
        {showBeam ? (
          <BorderBeam
            size={260}
            duration={14}
            borderWidth={1.5}
            colorFrom={LANDING_BRAND_BEAM_FROM}
            colorTo={LANDING_BRAND_BEAM_TO}
            delay={beamDelay}
          />
        ) : null}
        <div className="relative z-[1]">{children}</div>
      </Card>
    </div>
  );
}
