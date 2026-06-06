import { Timer, type LucideIcon } from "lucide-react";
import { CareIcon, CARE_ICON_REGISTRY, type CareIconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Lucide icons for journey pillars without a dedicated CareTip semantic icon. */
const JOURNEY_PILLAR_LUCIDE: Record<string, LucideIcon> = {
  timer: Timer,
};

function isCareIconName(value: string): value is CareIconName {
  return value in CARE_ICON_REGISTRY;
}

type JourneyPillarIconProps = {
  iconKey: string;
  className?: string;
};

export function JourneyPillarIcon({ iconKey, className }: JourneyPillarIconProps) {
  const shellClass = cn(
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/[0.12] ring-1 ring-primary/15 sm:h-8 sm:w-8",
    className,
  );

  const Lucide = JOURNEY_PILLAR_LUCIDE[iconKey];
  if (Lucide) {
    return (
      <span className={shellClass} aria-hidden>
        <Lucide
          className="h-4 w-4 text-primary/95 sm:h-[1.125rem] sm:w-[1.125rem]"
          strokeWidth={1.85}
        />
      </span>
    );
  }

  if (isCareIconName(iconKey)) {
    return (
      <span className={shellClass} aria-hidden>
        <CareIcon name={iconKey} size="sm" className="text-primary/95" />
      </span>
    );
  }

  return null;
}
