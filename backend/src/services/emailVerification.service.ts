import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../prisma.js";
import { getResendFromAddress, sendResendEmail } from "./resendClient.js";
import {
  buildVerifyEmailContent,
  buildWelcomeEmailContent,
  resolveEmailLocale,
  type EmailLocale,
} from "../emails/i18nEmail.js";

const VERIFY_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Hours — keep in sync with {@link VERIFY_TTL_MS} for email copy. */
export const VERIFY_EMAIL_EXPIRES_HOURS = VERIFY_TTL_MS / (60 * 60 * 1000);

function hashToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function getFrontendBaseUrl(): string {
  const u = process.env.FRONTEND_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:5173";
}

export function buildVerifyEmailUrl(plainToken: string): string {
  const token = String(plainToken ?? "").trim();
  /** Must match SPA route that consumes `token` (see `CheckEmailPage` / `VerifyEmailPage`). */
  return `${getFrontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationToken(userId: string): Promise<{
  plainToken: string;
  expiresAt: Date;
}> {
  /** Raw token is only sent in email; DB stores SHA-256 hex digest (same shape as employee activation). */
  const plainToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    }),
  ]);

  return { plainToken, expiresAt };
}

function renderVerifyEmail(locale: EmailLocale, verifyUrl: string) {
  try {
    return buildVerifyEmailContent({
      locale,
      verifyUrl,
      expiresInHours: VERIFY_EMAIL_EXPIRES_HOURS,
    });
  } catch {
    return buildVerifyEmailContent({
      locale: "en",
      verifyUrl,
      expiresInHours: VERIFY_EMAIL_EXPIRES_HOURS,
    });
  }
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  verifyUrl: string;
  locale: EmailLocale;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;

  const from = getResendFromAddress();
  const loc: EmailLocale = input.locale === "de" ? "de" : "en";
  const { subject, html, text } = renderVerifyEmail(loc, input.verifyUrl);

  const ok = await sendResendEmail("email-verify", { from, to: [to], subject, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info(
      "[email-verify] (dev) Verify email link — configure RESEND_API_KEY to send email:",
      input.verifyUrl,
    );
  }
}

function renderWelcome(locale: EmailLocale, dashboardUrl: string) {
  try {
    return buildWelcomeEmailContent({ locale, dashboardUrl });
  } catch {
    return buildWelcomeEmailContent({ locale: "en", dashboardUrl });
  }
}

export async function sendWelcomeEmail(input: { to: string; locale: EmailLocale }): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;
  const from = getResendFromAddress();
  const dashboardUrl = `${getFrontendBaseUrl()}/dashboard`;
  const loc: EmailLocale = input.locale === "de" ? "de" : "en";
  const { subject, html, text } = renderWelcome(loc, dashboardUrl);
  const ok = await sendResendEmail("welcome", { from, to: [to], subject, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info("[welcome] (dev) Would send welcome to:", to);
  }
}

export async function verifyEmailWithToken(plainToken: string): Promise<void> {
  const token = String(plainToken ?? "").trim();
  if (!token) {
    throw new Error("Verification link is invalid or has expired.");
  }
  const tokenHash = hashToken(token);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, preferredLocale: true } } },
  });
  if (!row || row.expiresAt < new Date()) {
    throw new Error("Verification link is invalid or has expired.");
  }

  // Verify user first, then promote employees — never leave `active` without `email_verified`.
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { emailVerified: true },
    });
    await tx.employee.updateMany({
      where: {
        userId: row.userId,
        activationStatus: "pending_verification",
      },
      data: { activationStatus: "active" },
    });
    await tx.emailVerificationToken.delete({ where: { id: row.id } });
  });

  const email = row.user.email?.trim().toLowerCase();
  if (email) {
    const welcomeLocale = resolveEmailLocale({
      explicitLocale: null,
      storedLocale: row.user.preferredLocale,
      acceptLanguage: null,
    });
    void sendWelcomeEmail({ to: email, locale: welcomeLocale }).catch((e) => {
      console.error("[email-verify] welcome email failed", { userId: row.userId }, e);
    });
  }
}
