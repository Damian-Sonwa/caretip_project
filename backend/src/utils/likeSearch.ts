/**
 * Escape PostgreSQL ILIKE metacharacters for literal substring search via Prisma `contains`.
 * Wildcard expansion (% / _) is intentionally not supported on search endpoints.
 */
export function escapeLikeContainsPattern(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Trim and escape user search text for Prisma `contains` filters. */
export function sanitizeLikeContainsSearch(raw: string | undefined | null): string | undefined {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return undefined;
  return escapeLikeContainsPattern(trimmed);
}
