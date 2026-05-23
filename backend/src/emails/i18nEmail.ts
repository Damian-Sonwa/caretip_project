/**
 * Transactional email copy (en / de). Missing keys fall back to English at render time.
 */

import {
  formatLoginAlertDevice,
  formatLoginAlertTimestamp,
  maskIpForLoginAlert,
  resolveLoginAlertTimeZone,
} from "./loginAlertFormat.js";

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

function loginAlertDetailRow(label: string, value: string): string {
  return `<tr>
<td style="padding:14px 18px;border-top:1px solid #eceae6;">
<p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">${esc(label)}</p>
<p style="margin:0;font-size:15px;line-height:1.45;font-weight:500;color:#111111;">${esc(value)}</p>
</td>
</tr>`;
}

export function buildLoginAlertContent(input: {
  locale: EmailLocale;
  /** Sign-in instant (prefer `when` over legacy `whenIso`). */
  when?: Date;
  whenIso?: string;
  ip?: string | null;
  userAgent?: string | null;
  timeZone?: string | null;
  appBaseUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const when = input.when ?? new Date(input.whenIso ?? Date.now());
  const timeZone = resolveLoginAlertTimeZone(input.timeZone);
  const whenFormatted = formatLoginAlertTimestamp(when, loc, timeZone);
  const device = formatLoginAlertDevice(input.userAgent, loc);
  const ipMasked = maskIpForLoginAlert(input.ip, loc);
  const appBase = (input.appBaseUrl?.trim() || "https://caretip.de").replace(/\/$/, "");
  const securityUrl = `${appBase}/forgot-password`;

  const copy =
    loc === "de"
      ? {
          subject: "Neue Anmeldung bei Ihrem CareTip-Konto",
          preheader: "Wir haben eine neue Anmeldung bei Ihrem Konto festgestellt.",
          headline: "Neue Anmeldung",
          intro:
            "Es gab soeben eine Anmeldung bei Ihrem CareTip-Konto. Hier sind die Details:",
          whenLabel: "Zeit",
          deviceLabel: "Gerät",
          locationLabel: "Standort (IP)",
          okLine:
            "Wenn Sie das waren, ist keine Aktion nötig — Sie können diese E-Mail ignorieren.",
          warnTitle: "Sie waren das nicht?",
          warnBody:
            "Sichern Sie Ihr Konto umgehend, indem Sie Ihr Passwort ändern und prüfen, ob Ihre E-Mail-Adresse noch korrekt ist.",
          cta: "Konto absichern",
          help:
            "Bei Fragen besuchen Sie unsere Hilfe oder wenden Sie sich an Ihren Administrator.",
          detailsTitle: "Anmeldedetails",
        }
      : {
          subject: "New sign-in to your CareTip account",
          preheader: "We noticed a new sign-in to your account.",
          headline: "New sign-in",
          intro: "Someone just signed in to your CareTip account. Here are the details:",
          whenLabel: "Time",
          deviceLabel: "Device",
          locationLabel: "Location (IP)",
          okLine: "If this was you, no action is needed — you can ignore this email.",
          warnTitle: "Don't recognize this activity?",
          warnBody:
            "Secure your account right away by changing your password and confirming your email address is still correct.",
          cta: "Secure my account",
          help: "Questions? Visit our Help Center or contact your administrator.",
          detailsTitle: "Sign-in details",
        };

  const detailRows = [
    loginAlertDetailRow(copy.whenLabel, whenFormatted),
    ...(device ? [loginAlertDetailRow(copy.deviceLabel, device)] : []),
    ...(ipMasked ? [loginAlertDetailRow(copy.locationLabel, ipMasked)] : []),
  ].join("");

  const html = `<!DOCTYPE html>
<html lang="${loc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${esc(copy.subject)}</title>
<!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f4f1;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(copy.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f4f1;">
<tr><td align="center" style="padding:28px 16px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 4px 14px;text-align:center;">
<span style="font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#e9781c;">${esc(b.brand)}</span>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid #e8e6e1;border-radius:14px;overflow:hidden;box-shadow:0 8px 28px rgba(17,17,17,0.06);">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td style="padding:28px 24px 8px;background:linear-gradient(180deg,#fffaf5 0%,#ffffff 42%);">
<p style="margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:700;color:#111111;">${esc(copy.headline)}</p>
<p style="margin:0;font-size:15px;line-height:1.55;color:#4b5563;">${esc(b.greeting)}</p>
<p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#374151;">${esc(copy.intro)}</p>
</td></tr>
<tr><td style="padding:4px 12px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafaf8;border:1px solid #eceae6;border-radius:10px;">
<tr><td style="padding:12px 18px 4px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">${esc(copy.detailsTitle)}</td></tr>
${detailRows}
</table>
</td></tr>
<tr><td style="padding:8px 24px 4px;">
<p style="margin:0;font-size:14px;line-height:1.55;color:#4b5563;">${esc(copy.okLine)}</p>
</td></tr>
<tr><td style="padding:12px 24px 20px;">
<p style="margin:0 0 6px;font-size:14px;line-height:1.45;font-weight:600;color:#111111;">${esc(copy.warnTitle)}</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#4b5563;">${esc(copy.warnBody)}</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
<tr><td align="center" style="border-radius:10px;background-color:#e9781c;">
<a href="${esc(securityUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;line-height:1.2;">${esc(copy.cta)}</a>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 8px 0;text-align:center;">
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;">${esc(copy.help)}</p>
<p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;">${esc(b.footer)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const textLines = [
    b.greeting,
    "",
    copy.intro,
    "",
    `${copy.whenLabel}: ${whenFormatted}`,
    ...(device ? [`${copy.deviceLabel}: ${device}`] : []),
    ...(ipMasked ? [`${copy.locationLabel}: ${ipMasked}`] : []),
    "",
    copy.okLine,
    "",
    `${copy.warnTitle} ${copy.warnBody}`,
    `${copy.cta}: ${securityUrl}`,
    "",
    copy.help,
    "",
    b.footer,
  ];

  return { subject: copy.subject, html, text: textLines.join("\n") };
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
