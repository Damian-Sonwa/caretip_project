function shouldLogDashboardTiming(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DASHBOARD_TIMING === "1";
}

/** Nested phase timing (only when DASHBOARD_TIMING=1 or non-production). */
export async function logDashboardPhase<T>(
  parentLabel: string,
  phase: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!shouldLogDashboardTiming()) return fn();
  const t0 = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - t0);
    console.info(`[dashboard.timing] ${parentLabel}.${phase} ${ms}ms`);
    return result;
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    console.error(`[dashboard.timing] ${parentLabel}.${phase} ${ms}ms FAILED`, err);
    throw err;
  }
}

/** Dev/profiling: log dashboard handler phase durations (ms). */
export async function logDashboardTiming<T>(
  label: string,
  meta: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const t0 = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - t0);
    if (shouldLogDashboardTiming()) {
      console.info(`[dashboard.timing] ${label} ${ms}ms`, meta);
    }
    return result;
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    console.error(`[dashboard.timing] ${label} ${ms}ms FAILED`, meta, err);
    throw err;
  }
}
