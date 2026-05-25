/** Client-visible code when dashboard stats cannot be loaded. */
export const STATS_FETCH_ERROR_CODE = "STATS_FETCH_ERROR" as const;

export class StatsFetchError extends Error {
  readonly code = STATS_FETCH_ERROR_CODE;

  constructor(
    message: string,
    readonly meta?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "StatsFetchError";
  }
}

export function logStatsPhase(
  phase: string,
  meta: Record<string, unknown>,
  err?: unknown,
): void {
  if (err != null) {
    console.error(`[business.stats] ${phase}`, meta, err);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    return;
  }
  console.info(`[business.stats] ${phase}`, meta);
}
