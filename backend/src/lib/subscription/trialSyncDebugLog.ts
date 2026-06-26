/** Temporary trial sync investigation logs — remove after webhook pipeline is verified. */
export function logTrialSync(stage: string, details: Record<string, unknown>): void {
  console.info(`[trial-sync] ${stage}`, JSON.stringify(details));
}
