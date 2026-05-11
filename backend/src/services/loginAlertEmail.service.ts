import { prisma } from "../prisma.js";
import { buildLoginAlertContent, resolveEmailLocale, type EmailLocale } from "../emails/i18nEmail.js";
import { getResendFromAddress, sendResendEmail } from "./resendClient.js";

function renderLoginAlert(input: Parameters<typeof buildLoginAlertContent>[0]) {
  try {
    return buildLoginAlertContent(input);
  } catch {
    return buildLoginAlertContent({ ...input, locale: "en" });
  }
}

export async function sendNewLoginAlertEmail(input: {
  to: string;
  ip?: string | null;
  userAgent?: string | null;
  acceptLanguage?: string | null;
  /** Client app language at sign-in (e.g. JSON body `locale`). */
  explicitLocale?: string | null;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;

  const user = await prisma.user.findUnique({
    where: { email: to },
    select: { preferredLocale: true },
  });

  const locale: EmailLocale = resolveEmailLocale({
    explicitLocale: input.explicitLocale ?? null,
    storedLocale: user?.preferredLocale ?? null,
    acceptLanguage: input.acceptLanguage ?? null,
  });

  const from = getResendFromAddress();
  const whenIso = new Date().toISOString();
  const { subject, html, text } = renderLoginAlert({
    locale,
    whenIso,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  const ok = await sendResendEmail("login-alert", { from, to: [to], subject, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info("[login-alert] (dev) Would send new-login alert to:", to);
  }
}
