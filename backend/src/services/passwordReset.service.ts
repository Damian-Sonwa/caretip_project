import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.js";
import { normalizeLoginEmail } from "./auth.service.js";
import { validatePassword } from "../utils/passwordValidation.js";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function getFrontendBaseUrl(): string {
  const u = process.env.FRONTEND_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:5173";
}

/**
 * Creates a reset token for password-based accounts. OAuth-only users get the same generic success (no enumeration).
 * In development, logs the reset URL when email delivery is not configured.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = normalizeLoginEmail(rawEmail);
  if (!email) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
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

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? "CareTip <onboarding@resend.dev>";

  if (resendKey) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Reset your CareTip password",
          html: `<p>Hi,</p><p><a href="${resetUrl}">Click here to reset your password</a>.</p><p>This link expires in one hour.</p>`,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("[password-reset] Resend error", r.status, t.slice(0, 500));
      }
    } catch (e) {
      console.error("[password-reset] Resend request failed", e);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[password-reset] (dev) Reset link — configure RESEND_API_KEY to send email:", resetUrl);
  } else {
    console.warn("[password-reset] RESEND_API_KEY not set; user requested reset but email was not sent.");
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
