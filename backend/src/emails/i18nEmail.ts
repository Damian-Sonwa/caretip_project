/**
 * Transactional email copy (en / de). Missing keys fall back to English at render time.
 */

import {
  formatLoginAlertDevice,
  formatLoginAlertTimestamp,
  maskIpForLoginAlert,
  resolveLoginAlertTimeZone,
} from "./loginAlertFormat.js";
import {
  emailBodyText,
  emailBodyTextLast,
  emailBrandMark,
  emailCardBody,
  emailCardBodyEnd,
  emailCardClose,
  emailCardOpen,
  emailCta,
  emailDocClose,
  emailDocOpen,
  emailFinePrint,
  emailFooterBlock,
  emailGreeting,
  emailHeadline,
  emailMetaBlock,
  emailPageWrap,
  emailPreheader,
  emailSubheading,
  emailSupportText,
  esc,
} from "./emailLayout.js";

export type EmailLocale = "en" | "de";

const SUPPORTED = new Set<EmailLocale>(["en", "de"]);

function normalizeExplicit(raw: string | null | undefined): EmailLocale | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  if (t.startsWith("de")) return "de";
  if (t.startsWith("en")) return "en";
  return null;
}

export function localeFromAcceptLanguage(
  header: string | null | undefined,
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

export function resolveUserPreferredLocale(
  storedLocale?: string | null,
): EmailLocale {
  const stored = normalizeExplicit(storedLocale ?? undefined);
  if (stored && SUPPORTED.has(stored)) return stored;
  return "en";
}

export function resolveEmailLocale(input: {
  explicitLocale?: string | null;
  storedLocale?: string | null;
  /** @deprecated Ignored — use User.preferredLocale / explicit CareTip UI locale only. */
  acceptLanguage?: string | null;
}): EmailLocale {
  const a = normalizeExplicit(input.explicitLocale ?? undefined);
  if (a && SUPPORTED.has(a)) return a;
  const b = normalizeExplicit(input.storedLocale ?? undefined);
  if (b && SUPPORTED.has(b)) return b;
  return "en";
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

function renderStandardEmail(input: {
  locale: EmailLocale;
  subject: string;
  preheader: string;
  headline: string;
  lines: string[];
  cta?: { href: string; label: string };
  finePrint?: string[];
  helpLine?: string | null;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);

  const bodyParts = [
    emailHeadline(input.headline),
    emailGreeting(b.greeting),
    ...input.lines.map((line, i) =>
      i === input.lines.length - 1 && !input.cta && !input.finePrint?.length
        ? emailBodyTextLast(line)
        : emailBodyText(line),
    ),
  ];

  const fine = (input.finePrint ?? []).map((t) => emailFinePrint(t)).join("");
  const cta = input.cta ? emailCta(input.cta.href, input.cta.label) : "";

  const inner = [
    emailBrandMark(b.brand),
    emailCardOpen(),
    emailCardBody(),
    ...bodyParts,
    fine,
    cta,
    emailCardBodyEnd(),
    emailCardClose(),
    emailFooterBlock(input.helpLine ?? null, b.footer),
  ].join("");

  const html = [
    emailDocOpen(loc, input.subject),
    emailPreheader(input.preheader),
    emailPageWrap(inner),
    emailDocClose(),
  ].join("");

  const textParts = [b.greeting, "", input.headline, "", ...input.lines];
  if (input.finePrint?.length) textParts.push("", ...input.finePrint);
  if (input.cta) textParts.push("", `${input.cta.label}: ${input.cta.href}`);
  if (input.helpLine) textParts.push("", input.helpLine);
  textParts.push("", b.footer);

  return { subject: input.subject, html, text: textParts.join("\n") };
}

export function buildVerifyEmailContent(input: {
  locale: EmailLocale;
  verifyUrl: string;
  expiresInHours?: number;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const expires = hoursExpiryPhrase(loc, input.expiresInHours ?? 1);
  const copy =
    loc === "de"
      ? {
          subject: "E-Mail-Adresse bestätigen",
          preheader: "Bestätigen Sie Ihre E-Mail für CareTip.",
          headline: "E-Mail bestätigen",
          line1: "Bitte bestätigen Sie Ihre E-Mail-Adresse für Ihr CareTip-Konto.",
          cta: "E-Mail bestätigen",
        }
      : {
          subject: "Verify your email",
          preheader: "Confirm your email for CareTip.",
          headline: "Verify your email",
          line1: "Please verify your email address for your CareTip account.",
          cta: "Verify email",
        };
  return renderStandardEmail({
    locale: loc,
    subject: copy.subject,
    preheader: copy.preheader,
    headline: copy.headline,
    lines: [copy.line1],
    cta: { href: input.verifyUrl, label: copy.cta },
    finePrint: [expires],
  });
}

export function buildPasswordResetContent(input: {
  locale: EmailLocale;
  resetUrl: string;
  expiresInHours?: number;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const expires = hoursExpiryPhrase(loc, input.expiresInHours ?? 1);
  const copy =
    loc === "de"
      ? {
          subject: "Passwort zurücksetzen",
          preheader: "Link zum Zurücksetzen Ihres CareTip-Passworts.",
          headline: "Passwort zurücksetzen",
          line1: "Sie haben ein Zurücksetzen des Passworts für Ihr CareTip-Konto angefordert.",
          cta: "Passwort zurücksetzen",
          warn: "Wenn Sie das nicht waren, ignorieren Sie diese E-Mail.",
        }
      : {
          subject: "Reset your password",
          preheader: "Link to reset your CareTip password.",
          headline: "Reset your password",
          line1: "You requested a password reset for your CareTip account.",
          cta: "Reset password",
          warn: "If you did not request this, you can ignore this email.",
        };
  return renderStandardEmail({
    locale: loc,
    subject: copy.subject,
    preheader: copy.preheader,
    headline: copy.headline,
    lines: [copy.line1],
    cta: { href: input.resetUrl, label: copy.cta },
    finePrint: [expires, copy.warn],
  });
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
          preheader: "Ihr CareTip-Konto ist bereit.",
          headline: `Willkommen bei ${b.brand}`,
          line1: "Ihr Konto ist bereit. Sie können jetzt loslegen.",
          cta: "Zum Dashboard",
        }
      : {
          subject: `Welcome to ${b.brand}`,
          preheader: "Your CareTip account is ready.",
          headline: `Welcome to ${b.brand}`,
          line1: "Your account is ready. You can get started anytime.",
          cta: "Go to dashboard",
        };
  return renderStandardEmail({
    locale: loc,
    subject: copy.subject,
    preheader: copy.preheader,
    headline: copy.headline,
    lines: [copy.line1],
    cta: { href: input.dashboardUrl, label: copy.cta },
  });
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
  return hoursExpiryPhrase(locale, h);
}

export function buildEmployeeActivationContent(input: {
  locale: EmailLocale;
  businessName: string;
  activationUrl: string;
  expiresInHours?: number;
  recipientName?: string | null;
}): { subject: string; html: string; text: string } {
  const loc = input.locale === "de" ? "de" : "en";
  const b = bundle(loc);
  const bn = input.businessName;
  const nm = input.recipientName?.trim();
  const greeting = nm ? (loc === "de" ? `Hallo ${nm},` : `Hi ${nm},`) : b.greeting;
  const expires = hoursExpiryPhraseDays(loc, input.expiresInHours ?? 24);
  const copy =
    loc === "de"
      ? {
          subject: `Einladung zu ${bn} auf ${b.brand}`,
          preheader: `Aktivieren Sie Ihr Team-Konto bei ${bn}.`,
          headline: "Konto aktivieren",
          line1: `Sie wurden zu ${bn} auf ${b.brand} eingeladen.`,
          line2: "Legen Sie Ihr Passwort fest, um Ihr Konto zu aktivieren.",
          cta: "Konto aktivieren",
        }
      : {
          subject: `Invitation to ${bn} on ${b.brand}`,
          preheader: `Activate your team account at ${bn}.`,
          headline: "Activate your account",
          line1: `You've been invited to join ${bn} on ${b.brand}.`,
          line2: "Set your password to activate your account.",
          cta: "Activate account",
        };

  const locBundle = bundle(loc);
  const inner = [
    emailBrandMark(locBundle.brand),
    emailCardOpen(),
    emailCardBody(),
    emailHeadline(copy.headline),
    emailGreeting(greeting),
    emailBodyText(copy.line1),
    emailBodyTextLast(copy.line2),
    emailCta(input.activationUrl, copy.cta),
    emailFinePrint(expires),
    emailCardBodyEnd(),
    emailCardClose(),
    emailFooterBlock(null, locBundle.footer),
  ].join("");

  const html = [
    emailDocOpen(loc, copy.subject),
    emailPreheader(copy.preheader),
    emailPageWrap(inner),
    emailDocClose(),
  ].join("");

  const text = [
    greeting,
    "",
    copy.line1,
    copy.line2,
    "",
    `${copy.cta}: ${input.activationUrl}`,
    "",
    expires,
    "",
    locBundle.footer,
  ].join("\n");

  return { subject: copy.subject, html, text };
}

export function buildLoginAlertContent(input: {
  locale: EmailLocale;
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
          subject: "Anmeldung bei Ihrem CareTip-Konto",
          preheader: "Wir haben eine Anmeldung bei Ihrem Konto festgestellt.",
          headline: "Anmeldung bestätigen",
          intro:
            "Es gab eine Anmeldung bei Ihrem CareTip-Konto. Nachfolgend finden Sie die Details:",
          whenLabel: "Zeit",
          deviceLabel: "Gerät",
          locationLabel: "Standort",
          okLine:
            "Wenn Sie das waren, ist keine Aktion erforderlich. Sie können diese E-Mail ignorieren.",
          warnTitle: "War das nicht Sie?",
          warnBody:
            "Zur Sicherheit empfehlen wir, Ihr Passwort zu aktualisieren und zu prüfen, ob Ihre E-Mail-Adresse noch korrekt ist.",
          cta: "Passwort aktualisieren",
          help: "Bei Fragen besuchen Sie unsere Hilfe oder wenden Sie sich an Ihren Administrator.",
        }
      : {
          subject: "Sign-in to your CareTip account",
          preheader: "We noticed a sign-in to your account.",
          headline: "Sign-in activity",
          intro: "Someone signed in to your CareTip account. Here are the details:",
          whenLabel: "Time",
          deviceLabel: "Device",
          locationLabel: "Location",
          okLine: "If this was you, no action is needed. You can ignore this email.",
          warnTitle: "Wasn't you?",
          warnBody:
            "For your security, we recommend updating your password and confirming your email address is still correct.",
          cta: "Update password",
          help: "Questions? Visit our Help Center or contact your administrator.",
        };

  const metaRows = [
    { label: copy.whenLabel, value: whenFormatted },
    ...(device ? [{ label: copy.deviceLabel, value: device }] : []),
    ...(ipMasked ? [{ label: copy.locationLabel, value: ipMasked }] : []),
  ];

  const inner = [
    emailBrandMark(b.brand),
    emailCardOpen(),
    emailCardBody(),
    emailHeadline(copy.headline),
    emailGreeting(b.greeting),
    emailBodyText(copy.intro),
    emailMetaBlock(metaRows),
    emailSupportText(copy.okLine),
    emailSubheading(copy.warnTitle),
    emailBodyTextLast(copy.warnBody),
    emailCta(securityUrl, copy.cta),
    emailCardBodyEnd(),
    emailCardClose(),
    emailFooterBlock(copy.help, b.footer),
  ].join("");

  const html = [
    emailDocOpen(loc, copy.subject),
    emailPreheader(copy.preheader),
    emailPageWrap(inner),
    emailDocClose(),
  ].join("");

  const textLines = [
    b.greeting,
    "",
    copy.intro,
    "",
    ...metaRows.map((r) => `${r.label}: ${r.value}`),
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
  const defaultAction = loc === "de" ? "In der App öffnen" : "Open in app";
  const actionLabel = input.actionLabel?.trim() || defaultAction;
  const subject = input.title.trim() || (loc === "de" ? "Benachrichtigung" : "Notification");
  const body = input.bodyText.trim() || "";
  const url = input.actionUrl?.trim();
  const preheader =
    loc === "de" ? "Neue Benachrichtigung von CareTip." : "New notification from CareTip.";

  const inner = [
    emailBrandMark(b.brand),
    emailCardOpen(),
    emailCardBody(),
    emailHeadline(subject),
    emailGreeting(b.greeting),
    emailBodyTextLast(body),
    ...(url && url.length > 0 ? [emailCta(url, actionLabel)] : []),
    emailCardBodyEnd(),
    emailCardClose(),
    emailFooterBlock(null, b.footer),
  ].join("");

  const html = [
    emailDocOpen(loc, subject),
    emailPreheader(preheader),
    emailPageWrap(inner),
    emailDocClose(),
  ].join("");

  const ctaText = url && url.length > 0 ? `\n${actionLabel}: ${url}\n` : "";
  const text = `${b.greeting}\n\n${subject}\n\n${body}${ctaText}\n${b.footer}`;

  return { subject, html, text };
}
