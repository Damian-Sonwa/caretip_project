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
}: LandingBorderedCardProps) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Card
        className={cn(
          "relative h-full overflow-hidden rounded-2xl border-border/90 bg-card text-card-foreground shadow-md transition-shadow duration-300 hover:shadow-xl",
          cardClassName,
        )}
      >
        <BorderBeam
          size={260}
          duration={14}
          borderWidth={1.5}
          colorFrom={LANDING_BRAND_BEAM_FROM}
          colorTo={LANDING_BRAND_BEAM_TO}
          delay={beamDelay}
        />
        <div className="relative z-[1]">{children}</div>
      </Card>
    </div>
  );
}
