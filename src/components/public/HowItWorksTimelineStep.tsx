import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";
import { HowItWorksStepVisual } from "@/components/public/HowItWorksStepVisual";
import type { HowItWorksVisualVariant } from "@/components/public/howItWorksFlow";

type HowItWorksTimelineStepProps = {
  step: number;
  badge: string;
  title: string;
  icon: LucideIcon;
  visual: HowItWorksVisualVariant;
  reverse?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  children: ReactNode;
};

export function HowItWorksTimelineStep({
  step,
  badge,
  title,
  icon: Icon,
  visual,
  reverse = false,
  isFirst = false,
  isLast = false,
  children,
}: HowItWorksTimelineStepProps) {
  return (
    <article className="relative">
      {!isLast ? (
        <div
          aria-hidden
          className="absolute bottom-0 left-[1.3125rem] top-14 hidden w-px bg-gradient-to-b from-primary/40 via-neutral-200/90 to-transparent sm:block lg:left-[1.375rem]"
        />
      ) : null}

      <div
        className={cn(
          "grid items-start gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-8 xl:gap-10",
          isFirst ? "lg:items-start" : "lg:items-center",
          isFirst && "lg:gap-7 xl:gap-9",
          reverse && "lg:[&>*:first-child]:lg:order-2 lg:[&>*:last-child]:lg:order-1",
        )}
      >
        <div className="flex min-w-0 gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-white shadow-[0_4px_14px_rgba(233,120,28,0.32)] sm:h-11 sm:w-11">
              {step}
            </div>
            <div className="absolute -inset-1.5 rounded-full bg-primary/10" aria-hidden />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="caretip-how-step__badge inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary sm:text-[11px]">
                  <Icon className="h-3 w-3" aria-hidden />
                  {badge}
                </span>
              </div>
              <h2 className="caretip-how-step__title text-xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-2xl dark:text-neutral-50">
                {title}
              </h2>
            </div>
            <div className="caretip-how-step__body space-y-4 text-[0.9375rem] leading-[1.68] text-neutral-700 dark:text-neutral-300">
              {children}
            </div>
          </div>
        </div>

        <HowItWorksStepVisual
          variant={visual}
          className={cn(
            "lg:justify-self-center",
            isFirst && "pt-2 sm:pt-3 lg:pt-4",
          )}
        />
      </div>
    </article>
  );
}

export function HowItWorksInsetPanel({ children }: { children: ReactNode }) {
  return <div className={publicPageUi.insetPanel}>{children}</div>;
}

export function HowItWorksMiniGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{children}</div>;
}

export function HowItWorksMiniCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={cn(publicPageUi.insetPanel, "bg-white p-3 text-center dark:bg-neutral-950/70")}>
      <p className="mb-1 text-xs font-semibold text-neutral-900 dark:text-neutral-50">{title}</p>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">{subtitle}</p>
    </div>
  );
}

export function HowItWorksStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function HowItWorksStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className={cn(publicPageUi.insetPanel, "bg-white p-3 dark:bg-neutral-950/70")}>
      <p className="text-lg font-semibold text-primary">{value}</p>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">{label}</p>
    </div>
  );
}
