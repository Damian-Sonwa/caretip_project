import type { ReactNode } from "react";

/** Splits static headline copy around one highlight phrase (brand accent). */
export function landingHeroHeadlineWithHighlight(
  headline: string,
  highlight: string | undefined,
  emphasisClassName: string,
): ReactNode {
  const word = highlight?.trim();
  if (!word) return headline;

  const index = headline.indexOf(word);
  if (index === -1) return headline;

  const before = headline.slice(0, index);
  const after = headline.slice(index + word.length);

  return (
    <>
      {before}
      <span className={emphasisClassName}>{word}</span>
      {after}
    </>
  );
}
