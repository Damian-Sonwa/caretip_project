import { prisma } from "../prisma.js";
import { resolveEmailPersonalizationForUser } from "../emails/emailPersonalization.js";
import { buildLoginAlertContent, resolveUserPreferredLocale, type EmailLocale } from "../emails/i18nEmail.js";
import { getResendFromAddress, sendResendEmail } from "./resendClient.js";

function renderLoginAlert(input: Parameters<typeof buildLoginAlertContent>[0]) {
  try {
    return buildLoginAlertContent(input);
  } catch {
    return buildLoginAlertContent({ ...input, locale: "en" });
  }
}

function appBaseUrl(): string {
  const u = process.env.FRONTEND_URL?.trim();
  return u ? u.replace(/\/$/, "") : "https://caretip.de";
}

export async function sendNewLoginAlertEmail(input: {
  to: string;
  ip?: string | null;
  userAgent?: string | null;
  /** CareTip UI language at sign-in (JSON body `locale`). */
  explicitLocale?: string | null;
  /** IANA timezone from the client when available (e.g. `Europe/Berlin`). */
  timeZone?: string | null;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;

  const user = await prisma.user.findUnique({
    where: { email: to },
    select: { id: true, preferredLocale: true },
  });

  const locale: EmailLocale = resolveUserPreferredLocale(
    input.explicitLocale ?? user?.preferredLocale ?? null,
  );

  const personalization = user?.id
    ? await resolveEmailPersonalizationForUser(user.id)
    : { recipientName: null, businessName: null, accountKind: "other" as const };

  const from = getResendFromAddress();
  const when = new Date();
  const { subject, html, text } = renderLoginAlert({
    locale,
    when,
    ip: input.ip,
    userAgent: input.userAgent,
    timeZone: input.timeZone,
    appBaseUrl: appBaseUrl(),
    recipientName: personalization.recipientName,
    businessName: personalization.businessName,
  });

  const ok = await sendResendEmail("login-alert", { from, to: [to], subject, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info("[login-alert] (dev) Would send new-login alert to:", to);
  }
}
