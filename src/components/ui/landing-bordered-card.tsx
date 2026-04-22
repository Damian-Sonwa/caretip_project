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
          "relative h-full overflow-hidden rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]",
          cardClassName,
        )}
      >
        <div className="relative z-[1]">{children}</div>
      </Card>
    </div>
  );
}
