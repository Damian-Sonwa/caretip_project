import { useId, useState, type ReactNode } from "react";
import { MarketingPicture } from "@/lib/marketingPicture";
import { splitLandingCopySentences } from "@/lib/landingCopyLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { caretipBtnPrimary, caretipBtnSecondary } from "@/lib/caretipButtonSystem";

export type ExpandableInfoCardProps = {
  imageSrc: string;
  imageWebpSrc?: string;
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
  imageWebpSrc,
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
  const detailId = useId();
  const detailSentences = splitLandingCopySentences(detail);

  return (
    <article
      className={cn(
        "caretip-expandable-info-card group flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-neutral-200 hover:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none dark:hover:border-neutral-700",
        className,
      )}
    >
      {tag ? (
        <div className="caretip-expandable-info-card__tag-slot px-5 pt-4 sm:px-6 sm:pt-5">
          <span className="caretip-expandable-info-card__image-label">{tag}</span>
        </div>
      ) : null}
      <div
        className={cn(
          "caretip-expandable-info-card__media relative aspect-[16/10] w-full overflow-hidden",
          tag ? "mt-0" : undefined,
          imageClassName,
        )}
      >
        <MarketingPicture
          src={imageSrc}
          webpSrc={imageWebpSrc}
          alt={imageAlt}
          className="h-full w-full object-cover object-center transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.01]"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="caretip-expandable-info-card__body flex flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <h3
          className={cn(
            "font-sans text-card-title font-semibold tracking-tight text-foreground",
            titleClassName,
          )}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{summary}</p>

        <div
          id={detailId}
          role="region"
          aria-label={title}
          aria-hidden={!expanded}
          className={cn(
            "caretip-expandable-info-card__detail",
            expanded && "caretip-expandable-info-card__detail--open",
          )}
        >
          <div
            className={cn(
              "caretip-expandable-info-card__detail-inner",
              detailSentences.length > 1 && "caretip-landing-copy-paragraphs",
            )}
          >
            {detailSentences.length > 1 ? (
              detailSentences.map((sentence, index) => <p key={index}>{sentence}</p>)
            ) : (
              <p className="mt-3 border-t border-neutral-100/90 pt-3 text-sm leading-[1.65] text-neutral-600 text-pretty dark:border-neutral-800 dark:text-neutral-400">
                {detail}
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant={expanded ? "outline" : "default"}
          className={cn(
            "caretip-expandable-info-card__cta mt-4 w-full sm:mt-4 sm:w-auto",
            expanded ? caretipBtnSecondary : caretipBtnPrimary,
          )}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? learnLessLabel : learnMoreLabel}
        </Button>
      </div>
    </article>
  );
}
