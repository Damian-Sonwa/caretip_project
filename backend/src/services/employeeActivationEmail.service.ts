import { buildEmployeeActivationContent, resolveUserPreferredLocale, type EmailLocale } from "../emails/i18nEmail.js";
import { prisma } from "../prisma.js";
import { getResendFromAddress, sendResendEmail } from "./resendClient.js";

function getFrontendBaseUrl(): string {
  const u = process.env.FRONTEND_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:5173";
}

export function buildEmployeeActivationUrl(rawToken: string): string {
  const token = String(rawToken ?? "").trim();
  return `${getFrontendBaseUrl()}/activate?token=${encodeURIComponent(token)}`;
}

function renderActivation(input: {
  locale: EmailLocale;
  businessName: string;
  activationUrl: string;
  expiresInHours: number;
  recipientName?: string | null;
}) {
  try {
    return buildEmployeeActivationContent(input);
  } catch {
    return buildEmployeeActivationContent({ ...input, locale: "en" });
  }
}

export async function sendEmployeeActivationEmail(input: {
  to: string;
  employeeName?: string;
  activationUrl: string;
  expiresInHours?: number;
  businessName: string;
  inviteeUserId?: string | null;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  const activationUrl = input.activationUrl;
  const expiresInHours = input.expiresInHours ?? 24;

  if (!to) return;

  const from = getResendFromAddress();
  let storedLocale: string | null = null;
  if (input.inviteeUserId) {
    const u = await prisma.user.findUnique({
      where: { id: input.inviteeUserId },
      select: { preferredLocale: true },
    });
    storedLocale = u?.preferredLocale ?? null;
  }
  const locale = resolveUserPreferredLocale(storedLocale);
  const { subject, html, text } = renderActivation({
    locale,
    businessName: input.businessName,
    activationUrl,
    expiresInHours,
    recipientName: input.employeeName,
  });

  const ok = await sendResendEmail("employee-activation", {
    from,
    to: [to],
    subject,
    html,
    text,
  });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info(
      "[employee-activation] (dev) Activation link — configure RESEND_API_KEY to send email:",
      activationUrl,
    );
  }
}
