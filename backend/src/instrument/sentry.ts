import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  });
  initialized = true;
}

export function isSentryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export function captureServerException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryConfigured()) return;
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

export { Sentry };
