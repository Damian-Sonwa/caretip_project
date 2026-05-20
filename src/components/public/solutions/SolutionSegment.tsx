import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";

type SolutionSegmentProps = {
  title: string;
  body: string;
  bullets: string[];
  cta: string;
  Icon: LucideIcon;
  reverse?: boolean;
};

export function SolutionSegment({ title, body, bullets, cta, Icon, reverse }: SolutionSegmentProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10",
        reverse && "lg:[&>*:first-child]:order-2",
      )}
    >
      <div className="space-y-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <h2 className={publicPageUi.sectionTitle}>{title}</h2>
        <p className="max-w-xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{body}</p>
        <ul className="space-y-2">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div
        className={cn(
          publicPageUi.card,
          publicPageUi.cardPad,
          publicPageUi.cardInteractive,
          "relative overflow-hidden",
        )}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/[0.08] blur-2xl"
          aria-hidden
        />
        <div className="relative space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-neutral-200/70 bg-[#fafaf8] px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/70">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              {title}
            </span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-neutral-200/60 bg-white/90 px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-950/80"
              >
                <div className="mb-1 h-1.5 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-2 w-full max-w-[4.5rem] rounded-full bg-neutral-100 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-neutral-200/70 bg-neutral-950 px-3 py-3 text-white dark:border-neutral-700">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/90">Tip received</p>
            <p className="mt-1 font-hero-display text-xl font-bold tracking-tight">€18.50</p>
          </div>
        </div>
      </div>
    </article>
  );
}
