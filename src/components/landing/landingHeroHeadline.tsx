import type { ReactNode } from "react";

type HighlightMatch = {
  index: number;
  word: string;
};

function collectHighlightMatches(headline: string, words: string[]): HighlightMatch[] {
  const matches: HighlightMatch[] = [];

  for (const raw of words) {
    const word = raw.trim();
    if (!word) continue;

    const index = headline.indexOf(word);
    if (index !== -1) {
      matches.push({ index, word });
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

/** Splits static headline copy around one or more highlight phrases (brand accent). */
export function landingHeroHeadlineWithHighlight(
  headline: string,
  highlight: string | string[] | undefined,
  emphasisClassName: string,
): ReactNode {
  const words = (Array.isArray(highlight) ? highlight : highlight ? [highlight] : [])
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) return headline;

  const matches = collectHighlightMatches(headline, words);
  if (matches.length === 0) return headline;

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const { index, word } of matches) {
    if (index < cursor) continue;
    if (index > cursor) {
      parts.push(headline.slice(cursor, index));
    }
    parts.push(
      <span key={`${index}-${word}`} className={emphasisClassName}>
        {word}
      </span>,
    );
    cursor = index + word.length;
  }

  if (cursor < headline.length) {
    parts.push(headline.slice(cursor));
  }

  return <>{parts}</>;
}
