import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { caretipBtnPrimary, caretipBtnSecondary } from "@/lib/caretipButtonSystem";

export type ExpandableInfoCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  summary: ReactNode;
  detail: string;
  tag?: string;
  learnMoreLabel: string;
  learnLessLabel: string;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
};

/**
 * Landing-style card with image, short summary, and expandable detail (Learn more).
 * Adapted from shadcn demo pattern — uses CareTip tokens (no external fonts).
 */
export function ExpandableInfoCard({
  imageSrc,
  imageAlt,
  title,
  summary,
  detail,
  tag,
  learnMoreLabel,
  learnLessLabel,
  className,
  imageClassName,
  titleClassName,
}: ExpandableInfoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const detailId = useId();

  return (
    <article
      className={cn(
        "caretip-expandable-info-card group flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-neutral-200 hover:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none dark:hover:border-neutral-700",
        className,
      )}
    >
      <div
        className={cn(
          "caretip-expandable-info-card__media relative aspect-[16/10] w-full overflow-hidden",
          imageClassName,
        )}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="caretip-expandable-info-card__body flex flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        {tag ? (
          <p className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-primary">{tag}</p>
        ) : null}
        <h3
          className={cn(
            "font-sans text-card-title font-semibold tracking-tight text-foreground",
            titleClassName,
          )}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{summary}</p>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              id={detailId}
              key="detail"
              role="region"
              aria-label={title}
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-3 border-t border-neutral-100/90 pt-3 text-sm leading-[1.65] text-neutral-600 text-pretty dark:border-neutral-800 dark:text-neutral-400">
                {detail}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Button
          type="button"
          variant={expanded ? "outline" : "default"}
          className={cn(
            "caretip-expandable-info-card__cta mt-4 w-full sm:mt-4 sm:w-auto",
            expanded ? caretipBtnSecondary : caretipBtnPrimary,
            "gap-1.5",
          )}
          aria-expanded={expanded}
          aria-controls={expanded ? detailId : undefined}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? learnLessLabel : learnMoreLabel}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")}
            aria-hidden
          />
        </Button>
      </div>
    </article>
  );
}
