/**
 * Layout helpers for landing copy — splits existing i18n strings at sentence
 * boundaries without altering approved wording.
 */
export function splitLandingCopySentences(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const segments = normalized.match(/[^.!?]+[.!?]+(?=\s+|$)|[^.!?]+$/g);
  if (!segments || segments.length <= 1) return [normalized];

  return segments.map((segment) => segment.trim()).filter(Boolean);
}
