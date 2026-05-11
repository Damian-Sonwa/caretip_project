/**
 * Transactional email copy (en / de). Missing keys fall back to English at render time.
 */

export type EmailLocale = "en" | "de";

const SUPPORTED = new Set<EmailLocale>(["en", "de"]);

function normalizeExplicit(raw: string | null | undefined): EmailLocale | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  if (t.startsWith("de")) return "de";
  if (t.startsWith("en")) return "en";
  return null;
}

/** First language tag from Accept-Language (e.g. "de-DE,en;q=0.9" -> de). */
export function localeFromAcceptLanguage(
  header: string | null | undefined
): EmailLocale | null {
  if (!header || typeof header !== "string") return null;
  const first = header.split(",")[0]?.trim();
  if (!first) return null;
  const tag = first.split(";")[0]?.trim().toLowerCase();
  if (!tag) return null;
  if (tag.startsWith("de")) return "de";
  if (tag.startsWith("en")) return "en";
  return null;
}

/**
 * Priority: explicit (app / body) → stored user locale → Accept-Language → English.
 */
export function resolveEmailLocale(input: {
  explicitLocale?: string | null;
  storedLocale?: string | null;
  acceptLanguage?: string | null;
}): EmailLocale {
  const a = normalizeExplicit(input.explicitLocale ?? undefined);
  if (a && SUPPORTED.has(a)) return a;
  const b = normalizeExplicit(input.storedLocale ?? undefined);
  if (b && SUPPORTED.has(b)) return b;
  const c = localeFromAcceptLanguage(input.acceptLanguage ?? undefined);
  if (c) return c;
  return "en";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Bundle = {
  brand: string;
  greeting: string;
  footer: string;
};

const common: Record<EmailLocale, Bundle> = {
  en: {
    brand: "CareTip",
    greeting: "Hello,",
    footer:
      "If you did not request this email, you can safely ignore it. This mailbox is not monitored.",
  },
  de: {
    brand: "CareTip",
    greeting: "Hallo,",
    footer:
      "Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren. Dieses Postfach wird nicht überwacht.",
  },
};

function bundle(locale: EmailLocale): Bundle {
  return common[locale] ?? common.en;
}

function hoursExpiryPhrase(locale: EmailLocale, hours: number): string {
  const h = Math.max(1, Math.round(hours));
  if (locale === "de") {
    return h === 1
      ? "Dieser Link ist 1 Stunde gültig."
      : `Dieser Link ist ${h} Stunden gültig.`;
  }
  return h === 1
    ? "This link expires in 1 hour."
    : `This link expires in ${h} hours.`;
}

export function buildVerifyEmailContent(input: {
  locale: EmailLocale;
  verifyUrl: string;
  /** Must match server token TTL (email verification). */
  expiresInHours?: number;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const expires = hoursExpiryPhrase(loc, input.expiresInHours ?? 1);
  const copy =
    loc === "de"
      ? {
          subject: "E-Mail-Adresse bestätigen",
          line1: "bitte bestätigen Sie Ihre E-Mail-Adresse für Ihr CareTip-Konto.",
          cta: "E-Mail bestätigen",
        }
      : {
          subject: "Verify your email",
          line1: "please verify your email address for your CareTip account.",
          cta: "Verify email",
        };
  const url = input.verifyUrl;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${esc(b.greeting)}</p>
<p>${esc(copy.line1)}</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">${esc(copy.cta)}</a></p>
<p style="font-size:14px;color:#555">${esc(expires)}</p>
<p style="font-size:12px;color:#888">${esc(b.footer)}</p>
</body></html>`;
  const text = `${b.greeting}\n\n${copy.line1}\n\n${url}\n\n${expires}\n\n${b.footer}`;
  return { subject: copy.subject, html, text };
}

export function buildPasswordResetContent(input: {
  locale: EmailLocale;
  resetUrl: string;
  expiresInHours?: number;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const expires = hoursExpiryPhrase(loc, input.expiresInHours ?? 1);
  const copy =
    loc === "de"
      ? {
          subject: "Passwort zurücksetzen",
          line1:
            "Sie haben ein Zurücksetzen des Passworts für Ihr CareTip-Konto angefordert.",
          cta: "Passwort zurücksetzen",
          warn: "Wenn Sie das nicht waren, ignorieren Sie diese E-Mail.",
        }
      : {
          subject: "Reset your password",
          line1: "You requested a password reset for your CareTip account.",
          cta: "Reset password",
          warn: "If you did not request this, you can ignore this email.",
        };
  const url = input.resetUrl;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${esc(b.greeting)}</p>
<p>${esc(copy.line1)}</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">${esc(copy.cta)}</a></p>
<p style="font-size:14px;color:#555">${esc(expires)}</p>
<p style="font-size:14px;color:#555">${esc(copy.warn)}</p>
<p style="font-size:12px;color:#888">${esc(b.footer)}</p>
</body></html>`;
  const text = `${b.greeting}\n\n${copy.line1}\n\n${url}\n\n${expires}\n\n${copy.warn}\n\n${b.footer}`;
  return { subject: copy.subject, html, text };
}

export function buildWelcomeEmailContent(input: {
  locale: EmailLocale;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const copy =
    loc === "de"
      ? {
          subject: `Willkommen bei ${b.brand}`,
          line1: "Ihr Konto ist bereit.",
          cta: "Zum Dashboard",
        }
      : {
          subject: `Welcome to ${b.brand}`,
          line1: "Your account is ready.",
          cta: "Go to dashboard",
        };
  const url = input.dashboardUrl;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${esc(b.greeting)}</p>
<p>${esc(copy.line1)}</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">${esc(copy.cta)}</a></p>
<p style="font-size:12px;color:#888">${esc(b.footer)}</p>
</body></html>`;
  const text = `${b.greeting}\n\n${copy.line1}\n\n${url}\n\n${b.footer}`;
  return { subject: copy.subject, html, text };
}

function hoursExpiryPhraseDays(locale: EmailLocale, hours: number): string {
  const h = Math.max(1, Math.round(hours));
  if (h >= 24 && h % 24 === 0) {
    const d = h / 24;
    if (locale === "de") {
      return d === 1 ? "Dieser Link ist 1 Tag gültig." : `Dieser Link ist ${d} Tage gültig.`;
    }
    return d === 1 ? "This link expires in 1 day." : `This link expires in ${d} days.`;
  }
  return hoursExpiryPhrase(locale, hours);
}

export function buildEmployeeActivationContent(input: {
  locale: EmailLocale;
  businessName: string;
  activationUrl: string;
  expiresInHours?: number;
  /** First name or display name for salutation; falls back to neutral greeting. */
  recipientName?: string | null;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const bn = input.businessName;
  const nm = input.recipientName?.trim();
  const salutationHtml = nm
    ? loc === "de"
      ? `<p>${esc(`Hallo ${nm},`)}</p>`
      : `<p>${esc(`Hi ${nm},`)}</p>`
    : `<p>${esc(b.greeting)}</p>`;
  const salutationText = nm ? (loc === "de" ? `Hallo ${nm},` : `Hi ${nm},`) : b.greeting;
  const expires = hoursExpiryPhraseDays(loc, input.expiresInHours ?? 24);
  const copy =
    loc === "de"
      ? {
          subject: `Einladung zu ${bn} – ${b.brand}`,
          line1: `Sie wurden zu ${bn} auf ${b.brand} eingeladen.`,
          line2: "Legen Sie Ihr Passwort fest, um Ihr Konto zu aktivieren.",
          cta: "Konto aktivieren",
        }
      : {
          subject: `Invitation to ${bn} – ${b.brand}`,
          line1: `You've been invited to join ${bn} on ${b.brand}.`,
          line2: "Set your password to activate your account.",
          cta: "Activate account",
        };
  const url = input.activationUrl;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
${salutationHtml}
<p>${esc(copy.line1)}</p>
<p>${esc(copy.line2)}</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">${esc(copy.cta)}</a></p>
<p style="font-size:14px;color:#555">${esc(expires)}</p>
<p style="font-size:12px;color:#888">${esc(b.footer)}</p>
</body></html>`;
  const text = `${salutationText}\n\n${copy.line1}\n${copy.line2}\n\n${url}\n\n${expires}\n\n${b.footer}`;
  return { subject: copy.subject, html, text };
}

export function buildLoginAlertContent(input: {
  locale: EmailLocale;
  whenIso: string;
  ip?: string | null;
  userAgent?: string | null;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const copy =
    loc === "de"
      ? {
          subject: "Neue Anmeldung bei Ihrem Konto",
          line1: "Es wurde eine neue Anmeldung bei Ihrem CareTip-Konto erkannt.",
          whenLabel: "Zeit",
          ipLabel: "IP-Adresse",
          deviceLabel: "Gerät",
          warn: "Wenn Sie das nicht waren, ändern Sie bitte umgehend Ihr Passwort.",
        }
      : {
          subject: "New sign-in to your account",
          line1: "A new sign-in to your CareTip account was detected.",
          whenLabel: "Time",
          ipLabel: "IP address",
          deviceLabel: "Device",
          warn: "If this was not you, change your password immediately.",
        };
  const ipLine =
    input.ip != null && String(input.ip).length > 0
      ? `<p>${esc(copy.ipLabel)}: ${esc(String(input.ip))}</p>`
      : "";
  const ipText =
    input.ip != null && String(input.ip).length > 0
      ? `${copy.ipLabel}: ${input.ip}\n`
      : "";
  const ua = input.userAgent?.trim();
  const deviceLine =
    ua && ua.length > 0
      ? `<p>${esc(copy.deviceLabel)}: ${esc(ua)}</p>`
      : "";
  const deviceText =
    ua && ua.length > 0 ? `${copy.deviceLabel}: ${ua}\n` : "";
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${esc(b.greeting)}</p>
<p>${esc(copy.line1)}</p>
<p>${esc(copy.whenLabel)}: ${esc(input.whenIso)}</p>
${ipLine}
${deviceLine}
<p style="font-size:14px;color:#555">${esc(copy.warn)}</p>
<p style="font-size:12px;color:#888">${esc(b.footer)}</p>
</body></html>`;
  const text = `${b.greeting}\n\n${copy.line1}\n\n${copy.whenLabel}: ${input.whenIso}\n${ipText}${deviceText}\n${copy.warn}\n\n${b.footer}`;
  return { subject: copy.subject, html, text };
}

export function buildGenericNotificationContent(input: {
  locale: EmailLocale;
  title: string;
  bodyText: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const defaultAction =
    loc === "de" ? "In der App öffnen" : "Open in app";
  const actionLabel = input.actionLabel?.trim() || defaultAction;
  const subject = input.title.trim() || (loc === "de" ? "Benachrichtigung" : "Notification");
  const body = input.bodyText.trim() || "";
  const url = input.actionUrl?.trim();
  const cta =
    url && url.length > 0
      ? `<p><a href="${esc(url)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">${esc(actionLabel)}</a></p>`
      : "";
  const ctaText = url && url.length > 0 ? `${actionLabel}: ${url}\n` : "";
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${esc(b.greeting)}</p>
<p><strong>${esc(subject)}</strong></p>
<p>${esc(body)}</p>
${cta}
<p style="font-size:12px;color:#888">${esc(b.footer)}</p>
</body></html>`;
  const text = `${b.greeting}\n\n${subject}\n\n${body}\n\n${ctaText}${b.footer}`;
  return { subject, html, text };
}
