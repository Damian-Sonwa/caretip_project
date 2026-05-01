import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import * as authService from "../services/auth.service.js";
import * as oauthAuthService from "../services/oauthAuth.service.js";
import * as emailVerificationService from "../services/emailVerification.service.js";
import * as passwordResetService from "../services/passwordReset.service.js";
import { prisma } from "../prisma.js";
import {
  clearRefreshCookie,
  issueRefreshToken,
  parseCookie,
  refreshCookieName,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
} from "../services/refreshToken.service.js";
import { checkAndIncrementEmailLimit } from "../utils/emailRateLimit.js";
import {
  logServerError,
  clientSafeMessage,
  CLIENT_FALLBACK,
  EmailNotVerifiedLoginError,
} from "../utils/httpErrors.js";

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

    if (role === "business") {
      const result = await authService.registerBusiness({
        email,
        password,
        name: typeof name === "string" ? name : undefined,
      });
      try {
        const rt = await issueRefreshToken(result.user.id);
        setRefreshCookie(res, rt.token);
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
      const result = await authService.registerEmployee({
        email,
        password,
        name,
        inviteCode,
      });
      try {
        const rt = await issueRefreshToken(result.user.id);
        setRefreshCookie(res, rt.token);
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
    try {
      const rt = await issueRefreshToken(result.user.id);
      setRefreshCookie(res, rt.token);
    } catch (e) {
      logServerError("auth.login.issueRefreshToken", e);
    }
    return res.json(result);
  } catch (err) {
    if (err instanceof EmailNotVerifiedLoginError) {
      return res.status(403).json({
        message: err.message,
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
        message: "Server configuration error (JWT). Contact support or check backend environment.",
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
    await authService.resendVerificationEmail({ email, password });
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
    await authService.resendVerificationEmailForSessionUser(uid);
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

    const result = await oauthAuthService.authenticateWithOAuth(provider, {
      idToken,
      intendedRole,
      isLogin,
      name,
      businessName,
      inviteCode,
      businessType,
      location,
    });
    try {
      const rt = await issueRefreshToken(result.user.id);
      setRefreshCookie(res, rt.token);
    } catch (e) {
      logServerError("auth.oauth.issueRefreshToken", e);
    }
    return res.status(isLogin ? 200 : 201).json(result);
  } catch (err) {
    if (err instanceof EmailNotVerifiedLoginError) {
      return res.status(403).json({
        message: err.message,
        code: err.code,
        canResend: err.canResend,
      });
    }
    const message = err instanceof Error ? err.message : "OAuth sign-in failed";
    if (message.includes("not configured") || message.includes("GOOGLE_CLIENT_ID")) {
      logServerError("auth.oauth", err);
      return res.status(503).json({ message });
    }
    if (
      message === "No account found for this email. Create an account first." ||
      message === "Email already registered. Sign in instead." ||
      message.includes("Invite code") ||
      message.includes("invite code") ||
      message.includes("Invalid or expired")
    ) {
      return res.status(400).json({ message });
    }
    if (
      message === "This account does not have Business permissions." ||
      message === "This account does not have Staff permissions."
    ) {
      return res.status(403).json({ message });
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
      if (!rotated) {
        clearRefreshCookie(res);
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      setRefreshCookie(res, rotated.newToken);
      const result = await authService.authResultForUserId(rotated.userId);
      return res.json(result);
    }

    /**
     * No refresh cookie (e.g. `issueRefreshToken` failed at login, cross-site cookie blocked, or dev DB
     * without RefreshToken rows). If the client still sends a valid access JWT, re-issue session from DB
     * so hydration and `apiRequest` 401 recovery do not wipe local auth.
     */
    const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
    const bearer =
      authHeader.startsWith("Bearer ") && authHeader.length > 7 ? authHeader.slice(7).trim() : "";
    if (bearer) {
      try {
        const secret = process.env.JWT_SECRET?.trim();
        if (!secret) throw new Error("JWT_SECRET not configured");
        const decoded = jwt.verify(bearer, secret) as { userId?: string; id?: string };
        const userId =
          (typeof decoded.userId === "string" && decoded.userId) ||
          (typeof decoded.id === "string" && decoded.id) ||
          null;
        if (userId) {
          const result = await authService.authResultForUserId(userId);
          return res.json(result);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "Authentication required" || msg === "Invalid email or password") {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
        logServerError("auth.refresh.bearerFallback", e);
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (err) {
    logServerError("auth.refresh", err);
    return res.status(503).json({ message: CLIENT_FALLBACK.loginUnexpected });
  }
}

/** Logs out by revoking the current refresh token and clearing the cookie. */
export async function logout(req: Request, res: Response) {
  try {
    const cookieHeader = req.headers.cookie;
    const token = parseCookie(cookieHeader, refreshCookieName());
    if (token) {
      await revokeRefreshToken(token);
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
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const normalized = authService.normalizeLoginEmail(email);

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

    await passwordResetService.requestPasswordReset(email);
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
      setRefreshCookie(res, rt.token);
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
      setRefreshCookie(res, rt.token);
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
