import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type LandingBorderedCardProps = {
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
};

/**
 * shadcn Card for landing sections: neutral border and surface, no brand beam.
 */
export function LandingBorderedCard({
  children,
  className,
  cardClassName,
}: LandingBorderedCardProps) {
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Card
        className={cn(
          "relative h-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white text-card-foreground shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
          cardClassName,
        )}
      >
        <div className="relative z-[1]">{children}</div>
      </Card>
    </div>
  );
}
