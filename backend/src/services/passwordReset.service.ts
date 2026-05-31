import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.js";
import { normalizeLoginEmail } from "./auth.service.js";
import { validatePassword } from "../utils/passwordValidation.js";
import { getResendFromAddress, sendResendEmail } from "./resendClient.js";
import { resolveEmailPersonalizationForUser } from "../emails/emailPersonalization.js";
import { buildPasswordResetContent, resolveUserPreferredLocale, type EmailLocale } from "../emails/i18nEmail.js";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_EXPIRES_HOURS = RESET_TTL_MS / (60 * 60 * 1000);

function hashToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function getFrontendBaseUrl(): string {
  const u = process.env.FRONTEND_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:5173";
}

function renderPasswordReset(
  locale: EmailLocale,
  resetUrl: string,
  personalization?: { recipientName?: string | null; businessName?: string | null },
) {
  try {
    return buildPasswordResetContent({
      locale,
      resetUrl,
      expiresInHours: RESET_EXPIRES_HOURS,
      recipientName: personalization?.recipientName,
      businessName: personalization?.businessName,
    });
  } catch {
    return buildPasswordResetContent({
      locale: "en",
      resetUrl,
      expiresInHours: RESET_EXPIRES_HOURS,
      recipientName: personalization?.recipientName,
      businessName: personalization?.businessName,
    });
  }
}

/**
 * Creates a reset token for password-based accounts. OAuth-only users get the same generic success (no enumeration).
 * In development, logs the reset URL when email delivery is not configured.
 */
export async function requestPasswordReset(
  rawEmail: string,
  opts?: { acceptLanguage?: string | null; explicitLocale?: string | null }
): Promise<void> {
  const email = normalizeLoginEmail(rawEmail);
  if (!email) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, preferredLocale: true },
  });

  if (!user?.passwordHash) {
    return;
  }

  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    }),
  ]);

  const resetUrl = `${getFrontendBaseUrl()}/reset-password/${encodeURIComponent(plainToken)}`;

  const from = getResendFromAddress();
  const locale = resolveUserPreferredLocale(
    opts?.explicitLocale ?? user.preferredLocale ?? null,
  );
  const personalization = await resolveEmailPersonalizationForUser(user.id);
  const { subject, html, text } = renderPasswordReset(locale, resetUrl, personalization);

  const ok = await sendResendEmail("password-reset", {
    from,
    to: [email],
    subject,
    html,
    text,
  });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info("[password-reset] (dev) Reset link — configure RESEND_API_KEY to send email:", resetUrl);
  }
}

export async function resetPasswordWithToken(plainToken: string, newPassword: string): Promise<void> {
  const token = String(plainToken ?? "").trim();
  if (!token) {
    throw new Error("Reset link is invalid or has expired.");
  }

  const pw = validatePassword(newPassword);
  if (!pw.valid) {
    throw new Error(pw.message ?? "Invalid password");
  }

  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });

  if (!row || row.expiresAt < new Date()) {
    throw new Error("Reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: row.id } }),
  ]);
}
