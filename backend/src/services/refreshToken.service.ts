import crypto from "crypto";
import { prisma } from "../prisma.js";

const COOKIE_NAME = "caretip_refresh";

// Prisma client typings depend on `prisma generate`. In some Windows setups this can fail locally,
// but the generated client in CI/production includes this model. Use a narrow cast to avoid blocking builds.
const refreshTokenModel = (prisma as any).refreshToken as {
  create: (args: any) => Promise<any>;
  findUnique: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  updateMany: (args: any) => Promise<any>;
};

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function nowPlusDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function refreshCookieName(): string {
  return COOKIE_NAME;
}

export function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function setRefreshCookie(
  res: { cookie: (name: string, value: string, opts: Record<string, unknown>) => void },
  value: string,
  opts?: { maxAgeMs?: number }
): void {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = typeof opts?.maxAgeMs === "number" ? opts.maxAgeMs : 30 * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, value, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge,
  });
}

export function clearRefreshCookie(
  res: { cookie: (name: string, value: string, opts: Record<string, unknown>) => void },
): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function issueRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(48).toString("base64url");
  const tokenHash = sha256Hex(token);
  const expiresAt = nowPlusDays(30);
  await refreshTokenModel.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    },
  });
  return { token, expiresAt };
}

export async function rotateRefreshToken(
  token: string
): Promise<{ userId: string; newToken: string; newExpiresAt: Date } | null> {
  const tokenHash = sha256Hex(token);
  const existing = await refreshTokenModel.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });
  if (!existing) return null;
  if (existing.revokedAt) return null;
  if (existing.expiresAt.getTime() <= Date.now()) return null;

  const { token: newToken, expiresAt: newExpiresAt } = await issueRefreshToken(existing.userId);
  const newHash = sha256Hex(newToken);
  const newRow = await refreshTokenModel.findUnique({
    where: { tokenHash: newHash },
    select: { id: true },
  });
  await refreshTokenModel.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: newRow?.id ?? null },
  });

  return { userId: existing.userId, newToken, newExpiresAt };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = sha256Hex(token);
  await refreshTokenModel.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

