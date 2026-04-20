/**
 * Consistent client-side error logging for try/catch and handlers.
 * Use the file or component name for `scope` (e.g. "AuthPage", "BusinessDashboard").
 */
export function logClientError(scope: string, error: unknown, extra?: unknown): void {
  if (extra !== undefined) {
    console.error(`Error in ${scope}:`, error, extra);
  } else {
    console.error(`Error in ${scope}:`, error);
  }
}
