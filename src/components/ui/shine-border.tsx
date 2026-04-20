import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type TColorProp = string | string[];

export interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

/**
 * Animated border shine behind content. Children sit in a `relative z-10` layer.
 */
export function ShineBorder({
  borderRadius = 16,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  const colorStops = Array.isArray(color) ? color.join(", ") : color;

  const shineStyle = {
    "--border-width": `${borderWidth}px`,
    "--border-radius": `${borderRadius}px`,
    "--shine-pulse-duration": `${duration}s`,
    "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    "--background-radial-gradient": `radial-gradient(transparent,transparent, ${colorStops},transparent,transparent)`,
  } as CSSProperties;

  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          borderRadius: `${borderRadius}px`,
        } as CSSProperties
      }
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[var(--border-radius)] bg-card p-3 text-foreground",
        className
      )}
    >
      <div
        aria-hidden
        style={shineStyle}
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[var(--border-radius)]",
          "before:absolute before:inset-0 before:size-full before:rounded-[var(--border-radius)] before:p-[length:var(--border-width)] before:will-change-[background-position] before:content-['']",
          "before:[-webkit-mask-composite:xor] before:![mask-composite:exclude] before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:[mask:var(--mask-linear-gradient)]",
          "motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]"
        )}
      />
      <div className="relative z-10 flex w-full flex-col">{children}</div>
    </div>
  );
}

export function TimelineContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center gap-3 md:order-2">
      {children}
    </div>
  );
}

export interface TimelineStep {
  label: string;
  message: string;
  icon: {
    Icon: LucideIcon;
    textColor: string;
    borderColor: string;
  };
}

export function TimelineEvent({
  label,
  message,
  icon,
  isLast = false,
}: TimelineStep & {
  isLast?: boolean;
}) {
  const { Icon, textColor, borderColor } = icon;
  return (
    <div className="group relative -m-2 flex gap-4 border border-transparent p-2">
      <div className="relative z-0 shrink-0">
        <div className={cn("relative z-10 rounded-full border bg-background p-2", borderColor)}>
          <Icon className={cn("h-4 w-4", textColor)} />
        </div>
        {!isLast ? (
          <div
            className="absolute left-1/2 top-[calc(100%-2px)] z-0 h-12 w-[2px] -translate-x-1/2 bg-muted"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-1 flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-lg font-semibold leading-snug">{label}</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="w-full max-w-xl">
      <TimelineContainer>
        {steps.map((event, i) => (
          <TimelineEvent
            key={event.label}
            isLast={i === steps.length - 1}
            {...event}
          />
        ))}
      </TimelineContainer>
    </div>
  );
}
