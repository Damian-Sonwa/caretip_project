import { useMemo, useState } from "react";
import { format } from "date-fns";
import { enUS, de } from "date-fns/locale";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CustomerFeedbackRow } from "@/app/lib/api";
import { cn } from "@/lib/utils";

const PREVIEW_MAX_CHARS = 160;

type CustomerFeedbackListItemProps = {
  item: CustomerFeedbackRow;
  className?: string;
};

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  const rounded = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rounded ? "fill-primary text-primary" : "text-muted-foreground/35",
          )}
          aria-hidden
        />
      ))}
      <span className="ml-1 text-xs tabular-nums text-muted-foreground">{rating}</span>
    </div>
  );
}

export function CustomerFeedbackListItem({ item, className }: CustomerFeedbackListItemProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.toLowerCase().startsWith("de") ? de : enUS;
  const [expanded, setExpanded] = useState(false);

  const comment = item.comment?.trim() ?? "";
  const hasLongComment = comment.length > PREVIEW_MAX_CHARS;
  const displayComment = useMemo(() => {
    if (!comment) return "";
    if (expanded || !hasLongComment) return comment;
    return `${comment.slice(0, PREVIEW_MAX_CHARS).trimEnd()}…`;
  }, [comment, expanded, hasLongComment]);

  const submittedAt = useMemo(() => {
    try {
      return format(new Date(item.createdAt), "PPp", { locale: dateLocale });
    } catch {
      return item.createdAt;
    }
  }, [item.createdAt, dateLocale]);

  const customerLabel =
    item.customerName?.trim() ||
    t("business.customerFeedback.anonymousGuest");

  return (
    <article
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 shadow-[0_4px_18px_-12px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-semibold text-foreground">{item.employeeName}</h3>
            <span className="text-xs text-muted-foreground" aria-hidden>
              ·
            </span>
            <p className="text-sm text-muted-foreground">{customerLabel}</p>
          </div>
          <StarRating rating={item.rating} />
        </div>
        <time className="shrink-0 text-xs text-muted-foreground" dateTime={item.createdAt}>
          {submittedAt}
        </time>
      </div>

      {comment ? (
        <div className="mt-3 space-y-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{displayComment}</p>
          {hasLongComment ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {expanded
                ? t("business.customerFeedback.showLess")
                : t("business.customerFeedback.readFullMessage")}
            </button>
          ) : null}
        </div>
      ) : null}

      {item.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t("business.customerFeedback.tagsAria")}>
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
