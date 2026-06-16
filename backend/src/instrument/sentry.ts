import * as Sentry from "@sentry/node";
import { sentryBeforeSend } from "./sentryScrub.js";

let initialized = false;

function resolveSentryDsn(): string {
  const raw = process.env.SENTRY_DSN?.trim() ?? "";
  return raw.replace(/^["']|["']$/g, "");
}

function resolveSentryEnvironment(): string {
  return process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development";
}

export function initSentry(): void {
  if (initialized) return;

  const dsn = resolveSentryDsn();
  if (!dsn) {
    console.log("[Sentry] Disabled (no DSN configured)");
    return;
  }

  const environment = resolveSentryEnvironment();

  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    beforeSend: sentryBeforeSend,
  });
  initialized = true;
  console.log("[Sentry] Enabled");
  console.log(`environment=${environment}`);
}

export function isSentryConfigured(): boolean {
  return Boolean(resolveSentryDsn());
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
