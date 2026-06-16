import * as Sentry from "@sentry/react";
import { sentryBeforeSend } from "./sentryScrub";

let initialized = false;

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() ||
      import.meta.env.MODE ||
      "development",
    release: import.meta.env.VITE_SENTRY_RELEASE?.trim() || undefined,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    beforeSend: sentryBeforeSend,
  });
  initialized = true;
}

export function isSentryConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());
}

export function captureClientException(
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
