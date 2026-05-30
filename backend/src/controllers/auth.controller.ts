import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import * as authService from "../services/auth.service.js";
import * as oauthAuthService from "../services/oauthAuth.service.js";
import * as emailVerificationService from "../services/emailVerification.service.js";
import * as passwordResetService from "../services/passwordReset.service.js";
import * as employeeActivationService from "../services/employeeActivation.service.js";
import { prisma } from "../prisma.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import {
  clearRefreshCookie,
  issueRefreshToken,
  parseCookie,
  refreshCookieMaxAgeMs,
  refreshCookieName,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  setRefreshCookie,
} from "../services/refreshToken.service.js";
import { checkAndIncrementEmailLimit } from "../utils/emailRateLimit.js";
import {
  logServerError,
  clientSafeMessage,
  CLIENT_FALLBACK,
  EmailNotVerifiedLoginError,
} from "../utils/httpErrors.js";
import { sendNewLoginAlertEmail } from "../services/loginAlertEmail.service.js";

function parseClientTimeZone(body: Record<string, unknown>): string | undefined {
  return typeof body.timeZone === "string" && body.timeZone.trim()
    ? body.timeZone.trim()
    : undefined;
}

async function notifyLoginSecurityAlerts(
  req: Request,
  userId: string,
  email: string,
  opts: { explicitLocale?: string; clientTimeZone?: string },
): Promise<void> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { notifyNewLogin: true },
  });
  if (!settings?.notifyNewLogin) return;

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    (req.socket.remoteAddress ?? null);
  const ua = String(req.headers["user-agent"] ?? "");

  await sendNewLoginAlertEmail({
    to: email,
    ip,
    userAgent: ua,
    explicitLocale: opts.explicitLocale,
    timeZone: opts.clientTimeZone,
  });
  const { onLoginSecurityAlert } = await import("../services/push/notification.triggers.js");
  onLoginSecurityAlert(userId);
}

/** Thrown by auth.service.login — always safe to return to the client as 401. */
const LOGIN_CLIENT_MESSAGES = new Set([
  "Invalid email or password",
  "Login failed",
  "This account does not have Business permissions.",
  "This account does not have Staff permissions.",
  "Use the Platform Admin sign-in for this account.",
]);

const LOGIN_FORBIDDEN_MESSAGES = new Set([
  "This account does not have Super Admin permissions.",
  "This account has been disabled.",
]);

/** User-safe hint; full error stays in server logs. */
function prismaFailureClientMessage(
  err: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientInitializationError | Prisma.PrismaClientRustPanicError,
): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const code = err.code;
    if (code === "P1001") {
      return "Cannot connect to PostgreSQL (network / host unreachable). Confirm DATABASE_URL uses your Supabase pooler host, the project is not paused, and try: NODE_OPTIONS=--dns-result-order=ipv4first on Windows if needed.";
    }
    if (code === "P1000") {
      return "Database authentication failed. Check the password and user in DATABASE_URL (Supabase → Connect → Session pooler).";
    }
    if (code === "P1017") {
      return "Database closed the connection. Retry in a moment; if it persists, check Supabase status and connection pool limits.";
    }
    if (code === "P2021" || code === "P2010" || code === "P1003") {
      return "Database schema is missing or out of date. From the backend folder run: npx prisma migrate deploy";
    }
    if (code === "P2022") {
      return "Database is missing columns the app expects (often User.is_active). Run: cd backend && npx prisma migrate deploy — or run backend/prisma/repair/sync_missing_columns.sql in Supabase SQL Editor, then restart the API.";
    }
    return `Database error (${code}). See API server logs for details.`;
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return "Unable to initialize the database client. Check DATABASE_URL (must use your Supabase pooler URL, not localhost).";
  }
  return "Database engine error. Restart the API and check server logs.";
}

function isForbiddenSuperAdminRolePayload(body: Record<string, unknown>): boolean {
  const r = body.role;
  if (typeof r !== "string") return false;
  const n = r.trim().toUpperCase().replace(/-/g, "_");
  return n === "SUPER_ADMIN" || n === "SUPERADMIN";
}

export async function register(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const { email, password, name, role, inviteCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (isForbiddenSuperAdminRolePayload(body)) {
      return res.status(403).json({
        message: "Super Admin accounts cannot be created through public registration.",
      });
    }
    if (body.isPlatformAdmin === true || body.is_platform_admin === true) {
      return res.status(403).json({
        message: "Platform admin privileges cannot be granted through public registration.",
      });
    }
    if (body.isActive === false || body.is_active === false) {
      return res.status(403).json({
        message: "Account status cannot be set through public registration.",
      });
    }

    const acceptLanguage = req.get("accept-language") ?? undefined;
    const locale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : undefined;

    if (role === "business") {
      const result = await authService.registerBusiness(
        {
          email,
          password,
          name: typeof name === "string" ? name : undefined,
          locale,
        },
        { acceptLanguage },
      );
      try {
        const rt = await issueRefreshToken(result.user.id);
        setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
      } catch (e) {
        logServerError("auth.register.issueRefreshToken", e);
      }
      return res.status(201).json(result);
    }

    if (role === "employee") {
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }
      const result = await authService.registerEmployee(
        {
          email,
          password,
          name,
          inviteCode,
          locale,
        },
        { acceptLanguage },
      );
      try {
        const rt = await issueRefreshToken(result.user.id);
        setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
      } catch (e) {
        logServerError("auth.register.issueRefreshToken", e);
      }
      return res.status(201).json(result);
    }

    return res.status(400).json({ message: "Invalid role. Use 'business' or 'employee'" });
  } catch (err) {
    logServerError("auth.register", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.register),
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const email = authService.normalizeLoginEmail(
      typeof body.email === "string" ? body.email : "",
    );
    const password = body.password;
    const intendedRole = authService.parseLoginIntendedRole(body.intendedRole);

    if (!email || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!intendedRole) {
      return res.status(400).json({
        message:
          "intendedRole is required and must be 'MANAGER', 'EMPLOYEE', or 'SUPER_ADMIN'",
      });
    }
    const result = await authService.login({
      email,
      password,
      intendedRole,
    });

    const loginClientLocale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : undefined;
    if (loginClientLocale === "en" || loginClientLocale === "de") {
      void prisma.user
        .update({
          where: { id: result.user.id },
          data: { preferredLocale: loginClientLocale },
        })
        .catch(() => {});
    }

    // Best-effort session alert email + push (opt-in via user_settings.notify_new_login).
    void (async () => {
      try {
        await notifyLoginSecurityAlerts(req, result.user.id, result.user.email, {
          explicitLocale: loginClientLocale,
          clientTimeZone: parseClientTimeZone(body),
        });
      } catch (e) {
        logServerError("auth.login.sessionAlertEmail", e);
      }
    })();
    try {
      const rt = await issueRefreshToken(result.user.id);
      setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
    } catch (e) {
      logServerError("auth.login.issueRefreshToken", e);
    }
    return res.json(result);
  } catch (err) {
    if (err instanceof EmailNotVerifiedLoginError) {
      return res.status(403).json({
        message:
          "Your email is not verified. Please check your inbox and verify your account before logging in.",
        code: err.code,
        canResend: err.canResend,
      });
    }
    const message = err instanceof Error ? err.message : "Login failed";
    if (
      message === "This account does not have Business permissions." ||
      message === "This account does not have Staff permissions."
    ) {
      return res.status(403).json({ message });
    }
    if (LOGIN_FORBIDDEN_MESSAGES.has(message)) {
      return res.status(403).json({ message });
    }
    if (LOGIN_CLIENT_MESSAGES.has(message)) {
      return res.status(401).json({ message });
    }

    if (message === "JWT_SECRET not configured") {
      logServerError("auth.login", err);
      return res.status(500).json({
        message: CLIENT_FALLBACK.loginUnexpected,
      });
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError ||
      err instanceof Prisma.PrismaClientInitializationError ||
      err instanceof Prisma.PrismaClientRustPanicError
    ) {
      logServerError("auth.login", err);
      const msg = prismaFailureClientMessage(err);
      return res.status(503).json({ message: msg });
    }

    logServerError("auth.login", err);
    return res.status(503).json({
      message: CLIENT_FALLBACK.loginUnexpected,
    });
  }
}

export async function twoFactorStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return res.json({ enabled: Boolean(u?.twoFactorEnabled) });
  } catch (err) {
    logServerError("auth.twoFactorStatus", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected) });
  }
}

export async function twoFactorSetup(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({
      name: `CareTip (${user.email})`,
      length: 20,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorTempSecret: secret.base32 },
    });

    const otpauthUrl = secret.otpauth_url ?? "";
    const qrDataUrl = otpauthUrl ? await qrcode.toDataURL(otpauthUrl) : "";

    return res.json({ otpauthUrl, qrDataUrl });
  } catch (err) {
    logServerError("auth.twoFactorSetup", err);
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected) });
  }
}

export async function twoFactorEnable(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const code = String((req.body as { code?: unknown })?.code ?? "").trim();
    if (!code) return res.status(400).json({ message: "Verification code is required" });

    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorTempSecret: true },
    });
    const temp = u?.twoFactorTempSecret ?? null;
    if (!temp) return res.status(400).json({ message: "2FA setup has not been started" });

    const ok = speakeasy.totp.verify({
      secret: temp,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!ok) return res.status(400).json({ message: "Invalid verification code" });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: temp,
        twoFactorTempSecret: null,
      },
    });

    return res.json({ enabled: true });
  } catch (err) {
    logServerError("auth.twoFactorEnable", err);
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected) });
  }
}

export async function twoFactorDisable(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const code = String((req.body as { code?: unknown })?.code ?? "").trim();
    if (!code) return res.status(400).json({ message: "Verification code is required" });

    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!u?.twoFactorEnabled || !u.twoFactorSecret) {
      return res.json({ enabled: false });
    }

    const ok = speakeasy.totp.verify({
      secret: u.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!ok) return res.status(400).json({ message: "Invalid verification code" });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorTempSecret: null },
    });

    return res.json({ enabled: false });
  } catch (err) {
    logServerError("auth.twoFactorDisable", err);
    return res.status(400).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected) });
  }
}

export async function resendVerificationEmail(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const email = authService.normalizeLoginEmail(
      typeof body.email === "string" ? body.email : "",
    );
    const password = body.password;
    if (!email || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const acceptLanguage = req.get("accept-language") ?? undefined;
    const locale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : undefined;
    await authService.resendVerificationEmail({ email, password, explicitLocale: locale, acceptLanguage });
    return res.json({
      ok: true,
      message: "We sent a new verification link to your email.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    if (message === "Invalid email or password") {
      return res.status(401).json({ message });
    }
    if (message === "Email is already verified.") {
      return res.status(400).json({ message });
    }
    logServerError("auth.resendVerificationEmail", err);
    return res.status(503).json({
      message: CLIENT_FALLBACK.loginUnexpected,
    });
  }
}

/** POST with Bearer JWT — same success shape as {@link resendVerificationEmail}; no password in body. */
export async function resendVerificationEmailForSession(req: Request, res: Response) {
  try {
    const uid = req.user?.userId ?? req.user?.id;
    if (!uid || typeof uid !== "string") {
      return res.status(401).json({ message: "Authentication required" });
    }
    const body = req.body as Record<string, unknown>;
    const acceptLanguage = req.get("accept-language") ?? undefined;
    const locale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : undefined;
    await authService.resendVerificationEmailForSessionUser(uid, {
      explicitLocale: locale,
      acceptLanguage,
    });
    return res.json({
      ok: true,
      message: "We sent a new verification link to your email.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    if (message === "Authentication required") {
      return res.status(401).json({ message });
    }
    if (message === "Email is already verified.") {
      return res.status(400).json({ message });
    }
    logServerError("auth.resendVerificationEmailForSession", err);
    return res.status(503).json({
      message: CLIENT_FALLBACK.loginUnexpected,
    });
  }
}

export async function oauth(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const provider = body.provider;
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const isLogin = body.isLogin === true;
    const intendedRole = authService.parseLoginIntendedRole(body.intendedRole);
    const name = typeof body.name === "string" ? body.name : undefined;
    const businessName = typeof body.businessName === "string" ? body.businessName : undefined;
    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode : undefined;
    const businessType = typeof body.businessType === "string" ? body.businessType : undefined;
    const location = typeof body.location === "string" ? body.location : undefined;

    if (provider !== "google") {
      return res.status(400).json({ message: "provider must be 'google'" });
    }
    if (!idToken.trim()) {
      return res.status(400).json({ message: "idToken is required" });
    }
    if (!intendedRole) {
      return res.status(400).json({
        message:
          "intendedRole is required and must be 'MANAGER', 'EMPLOYEE', or 'SUPER_ADMIN'",
      });
    }

    const locale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : undefined;
    const result = await oauthAuthService.authenticateWithOAuth(
      provider,
      {
        idToken,
        intendedRole,
        isLogin,
        name,
        businessName,
        inviteCode,
        businessType,
        location,
        locale,
      },
      { acceptLanguage: req.get("accept-language") ?? undefined },
    );
    try {
      const rt = await issueRefreshToken(result.user.id);
      setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
    } catch (e) {
      logServerError("auth.oauth.issueRefreshToken", e);
    }
    if (isLogin) {
      const oauthClientLocale =
        locale === "en" || locale === "de" ? locale : undefined;
      void (async () => {
        try {
          await notifyLoginSecurityAlerts(req, result.user.id, result.user.email, {
            explicitLocale: oauthClientLocale,
            clientTimeZone: parseClientTimeZone(body),
          });
        } catch (e) {
          logServerError("auth.oauth.loginSecurityAlert", e);
        }
      })();
    }
    return res.status(isLogin ? 200 : 201).json(result);
  } catch (err) {
    if (err instanceof EmailNotVerifiedLoginError) {
      return res.status(403).json({
        message:
          "Your email is not verified. Please check your inbox and verify your account before logging in.",
        code: err.code,
        canResend: err.canResend,
      });
    }
    const message = err instanceof Error ? err.message : "OAuth sign-in failed";
    if (message.includes("not configured") || message.includes("GOOGLE_CLIENT_ID")) {
      logServerError("auth.oauth", err);
      return res.status(503).json({ message: CLIENT_FALLBACK.loginUnexpected });
    }
    if (message === oauthAuthService.GOOGLE_ACCOUNT_NOT_REGISTERED_MESSAGE) {
      return res.status(400).json({
        message: oauthAuthService.GOOGLE_ACCOUNT_NOT_REGISTERED_MESSAGE,
        code: oauthAuthService.GOOGLE_ACCOUNT_NOT_REGISTERED_CODE,
      });
    }
    if (
      message === "Email already registered. Sign in instead." ||
      message.includes("Invite code") ||
      message.includes("invite code") ||
      message.includes("Invalid or expired")
    ) {
      return res.status(400).json({ message });
    }
    if (
      message === "This account has been disabled." ||
      message === "Use the Platform Admin sign-in for this account."
    ) {
      return res.status(403).json({ message });
    }
    if (message === "Only Google sign-in is supported.") {
      return res.status(400).json({ message });
    }
    if (message === "Platform admin sign-in is not available with Google.") {
      return res.status(403).json({ message });
    }
    if (message === "Invalid email or password") {
      return res.status(401).json({ message });
    }
    logServerError("auth.oauth", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected),
    });
  }
}

/** Issues a new access token when the short-lived JWT expires (refresh token rotated each use). */
export async function refresh(req: Request, res: Response) {
  try {
    const cookieHeader = req.headers.cookie;
    const rtCookie = parseCookie(cookieHeader, refreshCookieName());

    if (rtCookie) {
      const rotated = await rotateRefreshToken(rtCookie);
      if (rotated) {
        setRefreshCookie(res, rotated.newToken, { maxAgeMs: refreshCookieMaxAgeMs(rotated.newExpiresAt) });
        const result = await authService.authResultForUserId(rotated.userId);
        return res.json(result);
      }
      clearRefreshCookie(res);
    }

    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (bearer) {
      const { userIdFromAccessTokenForRefresh } = await import("../lib/accessTokenRefresh.js");
      const userId = userIdFromAccessTokenForRefresh(bearer);
      if (userId) {
        const rt = await issueRefreshToken(userId);
        setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
        const result = await authService.authResultForUserId(userId);
        return res.json(result);
      }
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (err) {
    logServerError("auth.refresh", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Authentication required" || msg.toLowerCase().includes("not found")) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Authentication required" });
    }
    return res.status(503).json({ message: CLIENT_FALLBACK.loginUnexpected });
  }
}

/** Logs out by revoking the current refresh session and clearing the cookie. */
export async function logout(req: Request, res: Response) {
  try {
    const cookieHeader = req.headers.cookie;
    const refreshCookie = parseCookie(cookieHeader, refreshCookieName());
    if (refreshCookie) {
      await revokeRefreshToken(refreshCookie);
    }

    if (refreshCookie) {
      const { userIdForRefreshToken } = await import("../services/refreshToken.service.js");
      const { removeAllPushDeviceTokensForUser } = await import(
        "../services/push/pushNotification.service.js"
      );
      const logoutUserId = await userIdForRefreshToken(refreshCookie);
      if (logoutUserId) {
        await removeAllPushDeviceTokensForUser(logoutUserId);
      }
    }

    clearRefreshCookie(res);
    return res.json({ ok: true });
  } catch (err) {
    logServerError("auth.logout", err);
    clearRefreshCookie(res);
    return res.status(503).json({ ok: false });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const normalized = authService.normalizeLoginEmail(email);
    const localeHint =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : undefined;

    // Per-email abuse protection (in addition to the IP-based limiter middleware).
    // Always log attempts before enforcing strict blocking.
    const lim = checkAndIncrementEmailLimit({
      key: normalized,
      maxPerWindow: 3,
    });
    console.info("[auth.forgotPassword] email rate", {
      email: normalized ? `${normalized.slice(0, 2)}***@***` : "",
      count: lim.count,
      allowed: lim.allowed,
    });
    if (!lim.allowed) {
      return res.status(429).json({ message: "Too many requests, try again later" });
    }

    await passwordResetService.requestPasswordReset(email, {
      acceptLanguage: req.get("accept-language") ?? undefined,
      explicitLocale: localeHint,
    });
    return res.status(200).json({
      ok: true,
      message:
        "If an account exists with that email, we sent instructions to reset your password.",
    });
  } catch (err) {
    logServerError("auth.forgotPassword", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected),
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!token.trim() || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }
    await passwordResetService.resetPasswordWithToken(token, password);
    return res.status(200).json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reset failed";
    if (
      message.includes("expired") ||
      message.includes("Invalid") ||
      message.includes("invalid")
    ) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }
    if (
      message.includes("Password must") ||
      message.includes("special") ||
      message.includes("uppercase") ||
      message.includes("lowercase") ||
      message.includes("characters")
    ) {
      return res.status(400).json({ message });
    }
    logServerError("auth.resetPassword", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.loginUnexpected),
    });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.json({ success: true });
  } catch (err) {
    logServerError("auth.changePassword", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.changePassword),
    });
  }
}

export async function patchMe(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role ?? req.user?.roleLabel;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const normalizedRole = typeof role === "string" ? role.trim().toUpperCase() : "";
    if (normalizedRole !== "MANAGER") {
      return res.status(403).json({ message: "Only business users can update onboarding status." });
    }

    const body = req.body as Record<string, unknown>;
    if (typeof body.hasCompletedOnboarding !== "boolean") {
      return res.status(400).json({ message: "hasCompletedOnboarding must be a boolean" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: body.hasCompletedOnboarding },
    });

    // Re-issue a fresh auth payload so the client immediately routes correctly.
    const result = await authService.authResultForUserId(userId);
    try {
      const rt = await issueRefreshToken(result.user.id);
      setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
    } catch (e) {
      logServerError("auth.patchMe.issueRefreshToken", e);
    }
    return res.json(result);
  } catch (err) {
    logServerError("auth.patchMe", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.changePassword),
    });
  }
}

export async function activateEmployee(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Activation token is required" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }

    const result = await authService.activateEmployee(token, password);
    try {
      const rt = await issueRefreshToken(result.user.id);
      setRefreshCookie(res, rt.token, { maxAgeMs: refreshCookieMaxAgeMs(rt.expiresAt) });
    } catch (e) {
      logServerError("auth.activateEmployee.issueRefreshToken", e);
    }
    return res.status(200).json(result);
  } catch (err) {
    logServerError("auth.activateEmployee", err);
    const message = err instanceof Error ? err.message : "Activation failed";

    if (
      message.includes("Invalid") ||
      message.includes("expired") ||
      message.includes("Expired") ||
      message.includes("invalid")
    ) {
      return res.status(400).json({ message: "Activation link is invalid or has expired." });
    }
    if (
      message.includes("Password must") ||
      message.includes("special") ||
      message.includes("uppercase") ||
      message.includes("lowercase") ||
      message.includes("characters")
    ) {
      return res.status(400).json({ message });
    }
    if (message.includes("already registered")) {
      return res.status(400).json({ message: "This email is already registered" });
    }

    return res.status(400).json({
      message: clientSafeMessage(err, "Activation failed. Please try again or contact support."),
    });
  }
}

/** Public preview for `/activate` so the invite/set-password screen can show venue branding. */
export async function activateEmployeeBrandingPreview(req: Request, res: Response) {
  try {
    const token = typeof req.query?.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      return res.status(400).json({ message: "Activation token is required" });
    }
    const preview = await employeeActivationService.validateActivationToken(token);
    if (!preview) {
      return res.status(400).json({ message: "Activation link is invalid or has expired." });
    }
    return res.json({
      businessName: preview.businessName,
      businessLogo: preview.businessLogo,
    });
  } catch (err) {
    logServerError("auth.activateEmployeeBrandingPreview", err);
    return res.status(400).json({
      message: clientSafeMessage(err, "Activation link is invalid or has expired."),
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const token = typeof req.query?.token === "string" ? req.query.token : "";
    if (!token.trim()) {
      return res.status(400).json({ message: "Verification token is required" });
    }
    await emailVerificationService.verifyEmailWithToken(token);
    return res.status(200).json({ ok: true, message: "Email verified." });
  } catch (err) {
    logServerError("auth.verifyEmail", err);
    const message = err instanceof Error ? err.message : "Verification failed";
    if (
      message.includes("invalid") ||
      message.includes("Invalid") ||
      message.includes("expired") ||
      message.includes("Expired")
    ) {
      return res.status(400).json({ message: "Verification link is invalid or has expired." });
    }
    return res.status(400).json({
      message: clientSafeMessage(err, "Verification failed. Please try again."),
    });
  }
}
