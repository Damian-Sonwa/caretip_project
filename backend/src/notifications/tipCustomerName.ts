import type { EmailLocale } from "../emails/i18nEmail.js";

/** Normalize guest/tipper name from payment metadata or transaction row. */
export function normalizeTipCustomerName(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  return trimmed || null;
}

/** Display name for the tipper in employee-facing notifications. */
export function resolveTipCustomerDisplayName(
  raw: string | null | undefined,
  locale: EmailLocale = "en",
): string {
  const normalized = normalizeTipCustomerName(raw);
  if (normalized) return normalized;
  return locale === "de" ? "Anonym" : "Anonymous";
}
