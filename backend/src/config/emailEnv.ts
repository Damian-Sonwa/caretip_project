/**
 * Resend / transactional email environment validation.
 * Production startup fails when required vars are missing or invalid.
 */

/** Plain `user@host.tld` or `Name <user@host.tld>`. */
export function isValidResendFromFormat(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const plain = /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/;
  if (plain.test(v)) return true;
  const named = /^(.+?)\s*<([^\s<>]+@[^\s<>]+\.[^\s<>]+)>\s*$/;
  const m = named.exec(v);
  return m != null && plain.test(m[2]);
}

/** Configured sender — `RESEND_FROM_EMAIL` preferred, `RESEND_FROM` alias. */
export function getResendFromRaw(): string | undefined {
  const raw = (process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM)?.trim();
  return raw || undefined;
}

export type EmailHealthDiagnostics = {
  /** True when production requirements are met (or dev has API key optional path). */
  configured: boolean;
  apiKeySet: boolean;
  fromAddressSet: boolean;
  fromAddressValid: boolean;
};

export function getEmailHealthDiagnostics(): EmailHealthDiagnostics {
  const apiKeySet = Boolean(process.env.RESEND_API_KEY?.trim());
  const fromRaw = getResendFromRaw();
  const fromAddressSet = Boolean(fromRaw);
  const fromAddressValid = fromRaw ? isValidResendFromFormat(fromRaw) : false;
  const isProd = process.env.NODE_ENV === "production";
  const configured = isProd
    ? apiKeySet && fromAddressSet && fromAddressValid
    : apiKeySet;
  return { configured, apiKeySet, fromAddressSet, fromAddressValid };
}

/** Exits the process when production email delivery cannot be configured. */
export function assertProductionEmailEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "FATAL: RESEND_API_KEY is required when NODE_ENV=production. " +
        "Transactional email (verification, activation, password reset) cannot be sent without it. " +
        "Set RESEND_API_KEY in your deployment environment (see backend/.env.example)."
    );
    process.exit(1);
  }

  const from = getResendFromRaw();
  if (!from) {
    console.error(
      "FATAL: RESEND_FROM is required when NODE_ENV=production. " +
        'Set RESEND_FROM to a verified sender, e.g. "CareTip <noreply@your-domain.com>" or "noreply@your-domain.com". ' +
        "RESEND_FROM_EMAIL is also accepted as an alias."
    );
    process.exit(1);
  }

  if (!isValidResendFromFormat(from)) {
    console.error(
      "FATAL: RESEND_FROM is invalid for Resend. " +
        'Use "email@domain.com" or "Display Name <email@domain.com>" — not a bare domain. ' +
        `Got: ${JSON.stringify(from)}`
    );
    process.exit(1);
  }
}
