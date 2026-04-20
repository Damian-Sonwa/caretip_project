import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../prisma.js";

const VERIFY_TTL_MS = 60 * 60 * 1000; // 1 hour

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
  return `${getFrontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationToken(userId: string): Promise<{
  plainToken: string;
  expiresAt: Date;
}> {
  const plainToken = randomBytes(32).toString("base64url");
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

export async function sendEmailVerificationEmail(input: {
  to: string;
  verifyUrl: string;
  expiresInHours?: number;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? "CareTip <onboarding@resend.dev>";
  const expiresInHours = input.expiresInHours ?? 1;

  const subject = "Verify your CareTip email";
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #0f172a;">
      <p>Welcome to CareTip,</p>
      <p>Please verify your email address to finish setting up your account.</p>
      <p style="margin: 24px 0;">
        <a href="${input.verifyUrl}" style="display: inline-block; background: #197278; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          Verify email
        </a>
      </p>
      <p>This link expires in ${expiresInHours} hour${expiresInHours === 1 ? "" : "s"}.</p>
      <p style="font-size: 12px; color: #475569;">If the button doesn’t work, copy and paste this link into your browser:<br/>${input.verifyUrl}</p>
    </div>
  `.trim();

  const text = `Welcome to CareTip,

Please verify your email address to finish setting up your account:
${input.verifyUrl}

This link expires in ${expiresInHours} hour${expiresInHours === 1 ? "" : "s"}.`;

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
          to: [to],
          subject,
          html,
          text,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("[email-verify] Resend error", r.status, t.slice(0, 500));
      }
    } catch (e) {
      console.error("[email-verify] Resend request failed", e);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[email-verify] (dev) Verify email link — configure RESEND_API_KEY to send email:", input.verifyUrl);
  } else {
    console.warn("[email-verify] RESEND_API_KEY not set; verification email was not sent.");
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
    include: { user: { select: { id: true } } },
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
}

