import { splitLandingCopySentences } from "@/lib/landingCopyLayout";
import { cn } from "@/lib/utils";

type LandingCopySentencesProps = {
  text: string;
  className?: string;
  sentenceClassName?: string;
  /** Spaced blocks for hero leads; scan rows for section intros. */
  layout?: "paragraphs" | "scan-list";
};

/** Renders approved i18n copy as shorter visual blocks — no wording changes. */
export function LandingCopySentences({
  text,
  className,
  sentenceClassName,
  layout = "paragraphs",
}: LandingCopySentencesProps) {
  const sentences = splitLandingCopySentences(text);

  if (sentences.length <= 1) {
    return <p className={className}>{text}</p>;
  }

  if (layout === "scan-list") {
    return (
      <ul className={cn("caretip-landing-copy-scan-list", className)} role="list">
        {sentences.map((sentence, index) => (
          <li
            key={index}
            className={cn("caretip-landing-copy-scan-list__item", sentenceClassName)}
            role="listitem"
          >
            {sentence}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("caretip-landing-copy-paragraphs", className)}>
      {sentences.map((sentence, index) => (
        <p key={index} className={sentenceClassName}>
          {sentence}
        </p>
      ))}
    </div>
  );
}
