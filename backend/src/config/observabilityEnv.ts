import { isSentryConfigured } from "../instrument/sentry.js";

export type ObservabilityHealthDiagnostics = {
  sentryConfigured: boolean;
};

export function getObservabilityHealthDiagnostics(): ObservabilityHealthDiagnostics {
  return {
    sentryConfigured: isSentryConfigured(),
  };
}
