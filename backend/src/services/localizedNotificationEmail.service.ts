import { prisma } from "../prisma.js";
import {
  buildGenericNotificationContent,
  resolveUserPreferredLocale,
  type EmailLocale,
} from "../emails/i18nEmail.js";
import { getResendFromAddress, sendResendEmail } from "./resendClient.js";

/**
 * Sends a generic transactional notification email using User.preferredLocale only.
 */
export async function sendLocalizedUserNotificationEmail(input: {
  to: string;
  userId?: string | null;
  preferredLocale?: string | null;
  title: string;
  bodyText: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;

  let stored = input.preferredLocale ?? null;
  if (stored == null && input.userId) {
    const u = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { preferredLocale: true },
    });
    stored = u?.preferredLocale ?? null;
  }

  let locale: EmailLocale = resolveUserPreferredLocale(stored);

  const from = getResendFromAddress();
  let subject: string;
  let html: string;
  let text: string;
  try {
    ({ subject, html, text } = buildGenericNotificationContent({
      locale,
      title: input.title,
      bodyText: input.bodyText,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
    }));
  } catch {
    locale = "en";
    ({ subject, html, text } = buildGenericNotificationContent({
      locale: "en",
      title: input.title,
      bodyText: input.bodyText,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
    }));
  }

  const ok = await sendResendEmail("notification", { from, to: [to], subject, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info("[notification] (dev) Would send to:", to, subject);
  }
}
