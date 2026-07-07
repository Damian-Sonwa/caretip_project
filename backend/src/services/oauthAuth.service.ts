import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma.js";
import { EmailNotVerifiedLoginError } from "../utils/httpErrors.js";
import {
  authResultForUserRecord,
  normalizeLoginEmail,
  type AuthIntendedRole,
  type AuthResult,
} from "./auth.service.js";
import { scheduleWelcomeEmailBestEffort } from "./emailVerification.service.js";
import { applyEmailVerificationBypassIfEligible } from "./emailVerificationBypass.service.js";
import { isSubscriptionBasicDefaultEnabled } from "../config/featureFlags.js";
import { provisionInternalBasicSubscription } from "./subscription.service.js";
import { generateUniqueBusinessSlugForName } from "./business.service.js";
import { registerEmployeeWithInvite } from "./employeeInvite.service.js";
import { resolveUserPreferredLocale } from "../emails/i18nEmail.js";

export const GOOGLE_ACCOUNT_NOT_REGISTERED_MESSAGE =
  "This Google account is not registered with CareTip yet. Please create an account first.";

export const GOOGLE_ACCOUNT_NOT_REGISTERED_CODE = "GOOGLE_ACCOUNT_NOT_REGISTERED" as const;

export const GOOGLE_TOKEN_VERIFICATION_FAILED_CODE = "GOOGLE_TOKEN_VERIFICATION_FAILED" as const;

export class GoogleTokenVerificationError extends Error {
  readonly code = GOOGLE_TOKEN_VERIFICATION_FAILED_CODE;

  constructor(message = "Google token verification failed") {
    super(message);
    this.name = "GoogleTokenVerificationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

type OAuthBody = {
  idToken: string;
  intendedRole?: AuthIntendedRole;
  isLogin: boolean;
  name?: string;
  businessName?: string;
  inviteCode?: string;
  businessType?: string;
  location?: string;
  locale?: string;
};

type VerifiedGoogleIdentity = {
  email: string;
  emailVerified: boolean;
  sub: string;
  name?: string;
};

const businessIncludeForOAuth = {
  select: {
    id: true,
    name: true,
    verificationStatus: true,
    onboardingVerificationStatus: true,
    kycVerificationStatus: true,
    businessType: true,
    registeredAddress: true,
  },
} as const;

const userIncludeForOAuth = {
  business: businessIncludeForOAuth,
  employee: { select: { id: true, name: true, avatar: true, businessId: true } },
} as const;

function resolveGoogleAudiences(): string[] {
  const fromList =
    process.env.GOOGLE_CLIENT_IDS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  if (fromList.length > 0) return fromList;

  const single =
    process.env.GOOGLE_CLIENT_ID?.trim() || process.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!single) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }
  return [single];
}

async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
  const audiences = resolveGoogleAudiences();
  const client = new OAuth2Client();
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: audiences });
    const payload = ticket.getPayload();
    const email = payload?.email?.trim().toLowerCase();
    const sub = payload?.sub?.trim();
    if (!email || !sub) {
      throw new GoogleTokenVerificationError();
    }
    return {
      email,
      emailVerified: payload.email_verified === true,
      sub,
      name: typeof payload.name === "string" ? payload.name.trim() : undefined,
    };
  } catch (err) {
    if (err instanceof GoogleTokenVerificationError) throw err;
    throw new GoogleTokenVerificationError();
  }
}

async function loadOAuthSessionUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userIncludeForOAuth,
  });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  return user;
}

export async function authenticateWithOAuth(
  provider: string,
  body: OAuthBody,
  opts?: { acceptLanguage?: string | null },
): Promise<AuthResult> {
  if (provider !== "google") {
    throw new Error("Only Google sign-in is supported.");
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
    throw new Error("idToken is required");
  }

  const verified = await verifyGoogleIdToken(idToken);
  if (!verified.emailVerified) {
    throw new GoogleTokenVerificationError("Google email is not verified");
  }

  const email = normalizeLoginEmail(verified.email);
  const oauthProvider = "google";
  const oauthSubject = verified.sub;
  const preferredLocale = body.locale?.trim()
    ? resolveUserPreferredLocale(body.locale)
    : null;

  if (body.isLogin) {
    let sessionUser =
      (await prisma.user.findFirst({
        where: { oauthProvider, oauthSubject },
        include: userIncludeForOAuth,
      })) ??
      (await prisma.user.findUnique({
        where: { email },
        include: userIncludeForOAuth,
      }));

    if (!sessionUser) {
      throw new Error(GOOGLE_ACCOUNT_NOT_REGISTERED_MESSAGE);
    }

    if (sessionUser.isActive !== true) {
      throw new Error("This account has been disabled.");
    }

    if (sessionUser.role === "SUPER_ADMIN") {
      throw new Error("Use the Platform Admin sign-in for this account.");
    }

    if (
      sessionUser.oauthProvider !== oauthProvider ||
      sessionUser.oauthSubject !== oauthSubject
    ) {
      const subjectOwner = await prisma.user.findFirst({
        where: { oauthProvider, oauthSubject },
        select: { id: true },
      });
      if (subjectOwner && subjectOwner.id !== sessionUser.id) {
        throw new Error("Email already registered. Sign in instead.");
      }

      sessionUser = await prisma.user.update({
        where: { id: sessionUser.id },
        data: { oauthProvider, oauthSubject },
        include: userIncludeForOAuth,
      });
    }

    if (sessionUser.emailVerified !== true) {
      const bypassed = await applyEmailVerificationBypassIfEligible(sessionUser);
      if (!bypassed) {
        throw new EmailNotVerifiedLoginError();
      }
      sessionUser = await loadOAuthSessionUser(sessionUser.id);
      if (sessionUser.emailVerified !== true) {
        throw new EmailNotVerifiedLoginError();
      }
    }

    const session = authResultForUserRecord(sessionUser);
    console.info(
      "[oauth] SESSION_CREATED",
      JSON.stringify({
        userId: session.user.id,
        role: session.user.role,
        channel: "login",
      }),
    );
    return session;
  }

  /** Sign up */
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Email already registered. Sign in instead.");
  }

  const intendedRole = body.intendedRole;
  if (intendedRole === "SUPER_ADMIN") {
    throw new Error("Platform admin sign-in is not available with Google.");
  }

  const inviteCode = body.inviteCode?.trim();
  const displayName =
    body.name?.trim() || verified.name || email.split("@")[0] || "User";

  if (inviteCode) {
    await registerEmployeeWithInvite({
      inviteCode,
      email,
      name: displayName,
      passwordHash: null,
      emailVerified: true,
      preferredLocale,
      oauthProvider,
      oauthSubject,
      activationStatus: "active",
      registrationChannel: "oauth",
    });

    const full = await prisma.user.findUnique({
      where: { email },
      include: userIncludeForOAuth,
    });
    if (!full) throw new Error("Registration failed");

    const session = authResultForUserRecord(full);
    console.info(
      "[oauth] SESSION_CREATED",
      JSON.stringify({
        userId: session.user.id,
        role: session.user.role,
        channel: "employee_invite",
      }),
    );
    return session;
  }

  if (intendedRole === "MANAGER") {
    const businessName = body.businessName?.trim();
    const businessType = body.businessType?.trim();
    const location = body.location?.trim();
    const bizName = businessName || `${displayName}'s venue`;
    const slug = await generateUniqueBusinessSlugForName(bizName);

    const created = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash: null,
            oauthProvider,
            oauthSubject,
            role: "MANAGER",
            isPlatformAdmin: false,
            emailVerified: true,
            preferredLocale,
            business: {
              create: {
                name: bizName,
                slug,
                businessType: businessType || null,
                location: location || null,
              },
            },
          },
          include: userIncludeForOAuth,
        });

        console.info(
          "[oauth] GOOGLE_USER_CREATED",
          JSON.stringify({ userId: user.id, email: user.email }),
        );

        const businessId = user.business?.id;
        if (!businessId) {
          throw new Error("Business creation failed during OAuth signup.");
        }

        console.info(
          "[oauth] BUSINESS_CREATED",
          JSON.stringify({ userId: user.id, businessId }),
        );

        if (isSubscriptionBasicDefaultEnabled()) {
          const provision = await provisionInternalBasicSubscription(businessId, {
            source: "oauth_signup",
            tx,
          });
          console.info(
            "[oauth] BASIC_SUBSCRIPTION_CREATED",
            JSON.stringify({
              businessId,
              subscriptionId: provision.subscriptionId,
              created: provision.created,
              skipped: provision.skipped,
            }),
          );
        }

        return user;
      },
      { maxWait: 10_000, timeout: 30_000 },
    );

    scheduleWelcomeEmailBestEffort({
      userId: created.id,
      email: created.email,
      explicitLocale: body.locale ?? null,
      storedLocale: created.preferredLocale,
      acceptLanguage: opts?.acceptLanguage ?? null,
      logContext: "oauth_manager_signup",
    });

    const session = authResultForUserRecord(created);
    console.info(
      "[oauth] SESSION_CREATED",
      JSON.stringify({
        userId: session.user.id,
        role: session.user.role,
        businessId: session.user.businessId ?? null,
      }),
    );
    return session;
  }

  if (intendedRole === "EMPLOYEE") {
    throw new Error("Invite code is required");
  }

  throw new Error("intendedRole is required and must be 'MANAGER', 'EMPLOYEE', or 'SUPER_ADMIN'");
}
