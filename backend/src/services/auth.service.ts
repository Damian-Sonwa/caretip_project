import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { BusinessVerificationStatus, Role, User } from "@prisma/client";
import { prisma } from "../prisma.js";
import { validatePassword } from "../utils/passwordValidation.js";
import { EmailNotVerifiedLoginError } from "../utils/httpErrors.js";
import { generateUniqueBusinessSlugForName } from "./business.service.js";
import {
  buildVerifyEmailUrl,
  createEmailVerificationToken,
  sendEmailVerificationEmail,
} from "./emailVerification.service.js";
import * as employeeActivationService from "./employeeActivation.service.js";
import { generateSlug, ensureUniqueSlug } from "../utils/slug.js";
import { applyEmailVerificationBypassIfEligible } from "./emailVerificationBypass.service.js";
import { absolutizePublicMediaPath } from "../utils/publicMediaUrl.js";
import { resolveEmailLocale } from "../emails/i18nEmail.js";

/** Mirrors the frontend `AuthResponse.user` shape (see `src/app/lib/api.ts`). */
export interface AuthUserDto {
  id: string;
  email: string;
  role: Role;
  name: string;
  /** False until the user completes email verification (password sign-up). */
  emailVerified: boolean;
  /** Business-only: whether onboarding has been completed. */
  hasCompletedOnboarding?: boolean;
  businessId?: string;
  employeeId?: string;
  avatar?: string | null;
  impersonation?: boolean;
  impersonatedBy?: string;
  businessVerificationStatus?: "pending" | "verified" | "rejected";
  /** UI + email language (`en` / `de`). */
  preferredLocale?: string | null;
}

export interface AuthResult {
  token: string;
  user: AuthUserDto;
}

export type LoginInput = {
  email: string;
  password: string;
  intendedRole: "MANAGER" | "EMPLOYEE" | "SUPER_ADMIN";
};

export function normalizeLoginEmail(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

export function parseLoginIntendedRole(
  raw: unknown
): LoginInput["intendedRole"] | null {
  if (typeof raw !== "string") return null;
  const n = raw.trim().toUpperCase().replace(/-/g, "_");
  if (n === "MANAGER" || n === "BUSINESS") return "MANAGER";
  if (n === "EMPLOYEE" || n === "STAFF") return "EMPLOYEE";
  if (n === "SUPER_ADMIN" || n === "SUPERADMIN" || n === "PLATFORM_ADMIN" || n === "ADMIN") {
    return "SUPER_ADMIN";
  }
  return null;
}

function roleLabel(role: Role): "MANAGER" | "EMPLOYEE" | "SUPER_ADMIN" {
  if (role === "MANAGER") return "MANAGER";
  if (role === "EMPLOYEE") return "EMPLOYEE";
  return "SUPER_ADMIN";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }
  return secret;
}

function jwtExpiresIn(): SignOptions["expiresIn"] {
  // Short-lived access token (15m default); override with `JWT_EXPIRES_IN` if needed.
  return (process.env.JWT_EXPIRES_IN?.trim() || "15m") as SignOptions["expiresIn"];
}

function impersonationJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_IMPERSONATION_EXPIRES_IN?.trim() || "12h") as SignOptions["expiresIn"];
}

function signAuthJwt(payload: Record<string, unknown>): string {
  const opts: SignOptions = { expiresIn: jwtExpiresIn() };
  return jwt.sign(payload, getJwtSecret(), opts);
}

export function signImpersonationToken(
  targetUserId: string,
  targetEmail: string,
  platformAdminUserId: string
): string {
  const opts: SignOptions = { expiresIn: impersonationJwtExpiresIn() };
  return jwt.sign(
    {
      userId: targetUserId,
      id: targetUserId,
      email: targetEmail,
      role: "MANAGER",
      roleLabel: "MANAGER",
      impersonatedBy: platformAdminUserId,
    },
    getJwtSecret(),
    opts
  );
}

type UserForAuthResult = User & {
  business?: { id: string; name: string; verificationStatus: BusinessVerificationStatus } | null;
  employee?: { id: string; name: string; avatar: string | null; businessId: string } | null;
};

function displayNameForUser(user: UserForAuthResult): string {
  if (user.role === "MANAGER" && user.business?.name) {
    return user.business.name;
  }
  if (user.role === "EMPLOYEE" && user.employee?.name) {
    return user.employee.name;
  }
  return user.email.split("@")[0] || "User";
}

export function authResultForUserRecord(user: UserForAuthResult): AuthResult {
  const tokenPayload: Record<string, unknown> = {
    userId: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    roleLabel: roleLabel(user.role),
  };

  const dto: AuthUserDto = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: displayNameForUser(user),
    emailVerified: user.emailVerified === true,
    preferredLocale: user.preferredLocale ?? null,
  };

  if (user.role === "MANAGER" && user.business) {
    dto.businessId = user.business.id;
    dto.businessVerificationStatus = user.business.verificationStatus;
    dto.hasCompletedOnboarding = (user as any).hasCompletedOnboarding === true;
  }
  if (user.role === "EMPLOYEE" && user.employee) {
    dto.employeeId = user.employee.id;
    dto.businessId = user.employee.businessId;
    dto.avatar = absolutizePublicMediaPath(user.employee.avatar ?? null);
  }

  return { token: signAuthJwt(tokenPayload), user: dto };
}

async function loadUserForAuthResult(userId: string): Promise<UserForAuthResult> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      business: { select: { id: true, name: true, verificationStatus: true } },
      employee: { select: { id: true, name: true, avatar: true, businessId: true } },
    },
  });
  if (!row) {
    throw new Error("Invalid email or password");
  }
  return row;
}

/** Used by refresh-token flow to re-issue an access token and user payload. */
export async function authResultForUserId(userId: string): Promise<AuthResult> {
  const user = await loadUserForAuthResult(userId);
  if (!user || user.isActive !== true) {
    throw new Error("Authentication required");
  }
  return authResultForUserRecord(user);
}

async function sendVerificationEmailBestEffort(
  userId: string,
  email: string,
  opts?: { explicitLocale?: string | null; acceptLanguage?: string | null }
): Promise<void> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLocale: true },
    });
    const locale = resolveEmailLocale({
      explicitLocale: opts?.explicitLocale ?? null,
      storedLocale: u?.preferredLocale ?? null,
      acceptLanguage: opts?.acceptLanguage ?? null,
    });
    const { plainToken } = await createEmailVerificationToken(userId);
    await sendEmailVerificationEmail({
      to: email,
      verifyUrl: buildVerifyEmailUrl(plainToken),
      locale,
    });
  } catch (e) {
    console.error("[auth] Failed to enqueue email verification", { userId, email }, e);
  }
}

export async function registerBusiness(
  input: {
    email: string;
    password: string;
    /** Optional display name for the account (not persisted to Business profile). */
    name?: string;
    /** Client app language (`en` / `de`); stored on user for email + UI consistency. */
    locale?: string | null;
  },
  opts?: { acceptLanguage?: string | null }
): Promise<AuthResult> {
  const email = normalizeLoginEmail(input.email);
  const pwCheck = validatePassword(input.password);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.message ?? "Password is required");
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const baseName = (email.split("@")[0] || "My").trim();
  const placeholderBusinessName = `${baseName} venue`;
  const slug = await generateUniqueBusinessSlugForName(placeholderBusinessName);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const preferredLocale = resolveEmailLocale({
    explicitLocale: input.locale ?? null,
    storedLocale: null,
    acceptLanguage: opts?.acceptLanguage ?? null,
  });

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "MANAGER",
      isPlatformAdmin: false,
      emailVerified: false,
      preferredLocale,
      business: {
        create: {
          name: placeholderBusinessName,
          slug,
          businessType: null,
          location: null,
          registeredAddress: null,
          contactPhone: null,
          contactEmail: null,
          website: null,
        },
      },
    },
    include: {
      business: { select: { id: true, name: true, verificationStatus: true } },
      employee: { select: { id: true, name: true, avatar: true, businessId: true } },
    },
  });

  // Managers must verify email for password sign-ups — await so delivery runs before HTTP response (serverless-safe).
  await sendVerificationEmailBestEffort(created.id, created.email, {
    explicitLocale: input.locale,
    acceptLanguage: opts?.acceptLanguage,
  });

  return authResultForUserRecord(created);
}

export async function registerEmployee(
  input: {
    email: string;
    password: string;
    name: string;
    inviteCode: string;
    locale?: string | null;
  },
  opts?: { acceptLanguage?: string | null }
): Promise<AuthResult> {
  const email = normalizeLoginEmail(input.email);
  const pwCheck = validatePassword(input.password);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.message ?? "Password is required");
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const code = String(input.inviteCode ?? "").trim();
  const business = await prisma.business.findFirst({
    where: {
      inviteCode: code,
      inviteCodeExpiresAt: { gt: new Date() },
    },
    select: { id: true, verificationStatus: true },
  });
  if (!business) {
    throw new Error("Invalid or expired invite code");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const preferredLocale = resolveEmailLocale({
    explicitLocale: input.locale ?? null,
    storedLocale: null,
    acceptLanguage: opts?.acceptLanguage ?? null,
  });

  const slug =
    business.verificationStatus === "verified"
      ? await (async () => {
          const baseSlug = generateSlug(input.name.trim());
          return ensureUniqueSlug(baseSlug, async (s) => {
            const hit = await prisma.employee.findUnique({ where: { slug: s } });
            return !!hit;
          });
        })()
      : null;

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "EMPLOYEE",
      isPlatformAdmin: false,
      emailVerified: false,
      preferredLocale,
      employee: {
        create: {
          name: input.name.trim(),
          jobTitle: "Staff",
          businessId: business.id,
          slug,
          activationStatus: "pending_verification",
        },
      },
    },
    include: {
      business: { select: { id: true, name: true, verificationStatus: true } },
      employee: { select: { id: true, name: true, avatar: true, businessId: true } },
    },
  });

  await sendVerificationEmailBestEffort(created.id, created.email, {
    explicitLocale: input.locale,
    acceptLanguage: opts?.acceptLanguage,
  });

  return authResultForUserRecord(created);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = normalizeLoginEmail(input.email);
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      business: { select: { id: true, name: true, verificationStatus: true } },
      employee: { select: { id: true, name: true, avatar: true, businessId: true } },
    },
  });

  if (!user || user.isActive !== true) {
    throw new Error("Invalid email or password");
  }
  if (!user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid email or password");
  }

  if (input.intendedRole === "MANAGER" && user.role === "EMPLOYEE") {
    throw new Error("This account does not have Business permissions.");
  }
  if (input.intendedRole === "EMPLOYEE" && user.role === "MANAGER") {
    throw new Error("This account does not have Staff permissions.");
  }

  if (user.role === "SUPER_ADMIN") {
    if (input.intendedRole !== "SUPER_ADMIN") {
      throw new Error("Use the Platform Admin sign-in for this account.");
    }
    if (!user.isPlatformAdmin) {
      throw new Error("This account does not have Super Admin permissions.");
    }
  } else if (input.intendedRole === "SUPER_ADMIN") {
    throw new Error("Invalid email or password");
  } else if (user.role !== mapIntendedToRole(input.intendedRole)) {
    throw new Error("Invalid email or password");
  }

  if (user.emailVerified !== true) {
    const bypassed = await applyEmailVerificationBypassIfEligible(user);
    if (!bypassed) {
      throw new EmailNotVerifiedLoginError();
    }
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        business: { select: { id: true, name: true, verificationStatus: true } },
        employee: { select: { id: true, name: true, avatar: true, businessId: true } },
      },
    });
    if (!user || user.emailVerified !== true) {
      throw new EmailNotVerifiedLoginError();
    }
  }

  return authResultForUserRecord(user);
}

/**
 * Re-sends the email verification link after the user proves they know the password.
 * Does not reveal whether the email exists (same errors as a failed password check when appropriate).
 */
export async function resendVerificationEmail(input: {
  email: string;
  password: string;
  explicitLocale?: string | null;
  acceptLanguage?: string | null;
}): Promise<void> {
  const email = normalizeLoginEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, emailVerified: true, isActive: true },
  });
  if (!user || user.isActive !== true || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid email or password");
  }
  if (user.emailVerified === true) {
    throw new Error("Email is already verified.");
  }
  await sendVerificationEmailBestEffort(user.id, email, {
    explicitLocale: input.explicitLocale,
    acceptLanguage: input.acceptLanguage,
  });
}

/**
 * Re-sends verification for the currently authenticated user (JWT), without requiring password again.
 * Used from the check-email screen right after sign-up while the session is still valid.
 */
export async function resendVerificationEmailForSessionUser(
  userId: string,
  opts?: { explicitLocale?: string | null; acceptLanguage?: string | null }
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true, isActive: true },
  });
  if (!user || user.isActive !== true) {
    throw new Error("Authentication required");
  }
  if (user.emailVerified === true) {
    throw new Error("Email is already verified.");
  }
  const email = normalizeLoginEmail(user.email);
  await sendVerificationEmailBestEffort(user.id, email, {
    explicitLocale: opts?.explicitLocale,
    acceptLanguage: opts?.acceptLanguage,
  });
}

function mapIntendedToRole(intended: LoginInput["intendedRole"]): Role {
  if (intended === "MANAGER") return "MANAGER";
  if (intended === "EMPLOYEE") return "EMPLOYEE";
  return "SUPER_ADMIN";
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    throw new Error("Current password is incorrect");
  }

  const currentOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentOk) {
    throw new Error("Current password is incorrect");
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.message ?? "Password is required");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function activateEmployee(token: string, password: string): Promise<AuthResult> {
  const plain = String(token ?? "").trim();
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.message ?? "Password is required");
  }

  const validated = await employeeActivationService.validateActivationToken(plain);
  if (!validated) {
    throw new Error("Invalid or expired token");
  }

  const email = normalizeLoginEmail(validated.email);
  if (!email) {
    throw new Error("Invalid or expired token");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: validated.employeeId },
    include: {
      user: { select: { id: true, email: true, passwordHash: true } },
      business: { select: { verificationStatus: true } },
    },
  });
  if (!employee || employee.activationStatus !== "pending_activation") {
    throw new Error("Invalid or expired token");
  }

  const linkedUser = employee.user;
  if (linkedUser) {
    if (normalizeLoginEmail(linkedUser.email) !== email) {
      throw new Error("Invalid or expired token");
    }
    if (linkedUser.passwordHash != null) {
      throw new Error("Invalid or expired token");
    }
  } else {
    // Legacy rows without `user_id` — create the auth user on first successful activation.
    const conflicting = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (conflicting) {
      throw new Error("Invalid or expired token");
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const slug =
    employee.business.verificationStatus === "verified"
      ? await (async () => {
          const baseSlug = generateSlug(employee.name.trim());
          return ensureUniqueSlug(baseSlug, async (s) => {
            const hit = await prisma.employee.findUnique({ where: { slug: s } });
            return !!hit;
          });
        })()
      : employee.slug;

  let resolvedUserId!: string;

  // Dashboard activation (password setup only): same transaction, user row first — password stored,
  // email treated as confirmed for login, then employee becomes active. No email-verification tokens.
  await prisma.$transaction(async (tx) => {
    if (linkedUser && employee.userId) {
      resolvedUserId = employee.userId;
      await tx.user.update({
        where: { id: employee.userId },
        data: { passwordHash, emailVerified: true },
      });
      await tx.employee.update({
        where: { id: employee.id },
        data: { activationStatus: "active", slug },
      });
    } else {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "EMPLOYEE",
          isPlatformAdmin: false,
          emailVerified: true,
        },
      });
      resolvedUserId = created.id;
      await tx.employee.update({
        where: { id: employee.id },
        data: {
          userId: created.id,
          activationStatus: "active",
          slug,
        },
      });
    }
  });

  await employeeActivationService.consumeActivationToken(employee.id);

  const refreshed = await loadUserForAuthResult(resolvedUserId);
  return authResultForUserRecord(refreshed);
}
