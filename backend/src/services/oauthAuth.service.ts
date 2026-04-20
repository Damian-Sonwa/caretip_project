import { OAuth2Client } from "google-auth-library";
import type { Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import {
  authResultForUserRecord,
  normalizeLoginEmail,
  type AuthResult,
  type LoginInput,
} from "./auth.service.js";
import * as businessService from "./business.service.js";

/** Social OAuth supported by `/api/auth/oauth` (Google only; Apple removed temporarily). */
export type OAuthProvider = "google";

export interface OAuthAuthBody {
  idToken: string;
  intendedRole: LoginInput["intendedRole"];
  isLogin: boolean;
  name?: string;
  businessName?: string;
  inviteCode?: string;
  businessType?: string;
  location?: string;
}

async function verifyGoogleIdToken(idToken: string): Promise<{
  email: string;
  sub: string;
  name: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("Google sign-in is not configured on the server (GOOGLE_CLIENT_ID).");
  }
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const p = ticket.getPayload();
  if (!p?.email || !p.sub) {
    throw new Error("Google token did not include email or subject.");
  }
  if (p.email_verified === false) {
    throw new Error("Google email is not verified.");
  }
  const name =
    (typeof p.name === "string" && p.name.trim()) ||
    (typeof p.given_name === "string" && p.given_name.trim()) ||
    p.email.split("@")[0] ||
    "User";
  return { email: normalizeLoginEmail(p.email), sub: p.sub, name };
}

function mapIntendedToRole(intended: LoginInput["intendedRole"]): Role {
  if (intended === "MANAGER") return "MANAGER";
  if (intended === "EMPLOYEE") return "EMPLOYEE";
  return "SUPER_ADMIN";
}

export async function authenticateWithOAuth(
  provider: OAuthProvider,
  body: OAuthAuthBody
): Promise<AuthResult> {
  const { idToken, intendedRole, isLogin, name: nameOverride, businessName, inviteCode, businessType, location } = body;
  if (!idToken?.trim()) {
    throw new Error("Missing identity token.");
  }
  if (provider !== "google") {
    throw new Error("Only Google sign-in is supported.");
  }
  if (intendedRole === "SUPER_ADMIN") {
    throw new Error("Platform admin sign-in is not available with Google.");
  }

  const verified = await verifyGoogleIdToken(idToken);

  const oauthProvider = provider;
  const oauthSubject = verified.sub;

  const byOauth = await prisma.user.findFirst({
    where: { oauthProvider, oauthSubject },
  });
  let user = byOauth;
  if (!user && verified.email) {
    user = await prisma.user.findUnique({ where: { email: verified.email } });
  }

  const displayName = (
    nameOverride?.trim() ||
    verified.name ||
    (verified.email ? verified.email.split("@")[0] : "User")
  ).slice(0, 120);
  const targetRole = mapIntendedToRole(intendedRole);

  if (isLogin) {
    if (!user) {
      throw new Error("No account found for this email. Create an account first.");
    }
    if (user.isActive !== true) {
      throw new Error("This account has been disabled.");
    }
    if (intendedRole === "MANAGER" && user.role === "EMPLOYEE") {
      throw new Error("This account does not have Business permissions.");
    }
    if (intendedRole === "EMPLOYEE" && user.role === "MANAGER") {
      throw new Error("This account does not have Staff permissions.");
    }
    if (user.role === "SUPER_ADMIN") {
      throw new Error("Use the Platform Admin sign-in for this account.");
    }
    if (user.role !== targetRole) {
      throw new Error("Invalid email or password");
    }

    if (user.oauthProvider !== oauthProvider || user.oauthSubject !== oauthSubject) {
      await prisma.user.update({
        where: { id: user.id },
        data: { oauthProvider, oauthSubject },
      });
    }

    return authResultForUserRecord(user);
  }

  /** Sign up */
  if (user) {
    throw new Error("Email already registered. Sign in instead.");
  }

  if (!verified.email) {
    throw new Error("Google did not return an email for this account.");
  }

  if (intendedRole === "MANAGER") {
    const bizName = businessName?.trim() || `${displayName}'s venue`;
    const slug = await businessService.generateUniqueBusinessSlugForName(bizName);
    const created = await prisma.user.create({
      data: {
        email: verified.email,
        passwordHash: null,
        oauthProvider,
        oauthSubject,
        role: "MANAGER",
        isPlatformAdmin: false,
        emailVerified: true,
        business: {
          create: {
            name: bizName,
            slug,
            businessType: businessType || null,
            location: location || null,
          },
        },
      },
      include: { business: true },
    });
    return authResultForUserRecord(created);
  }

  if (intendedRole === "EMPLOYEE") {
    const code = inviteCode?.trim();
    if (!code) {
      throw new Error("Invite code is required for staff sign-up.");
    }
    const business = await prisma.business.findFirst({
      where: {
        inviteCode: code,
        inviteCodeExpiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!business) {
      throw new Error("Invalid or expired invite code");
    }
    const created = await prisma.user.create({
      data: {
        email: verified.email,
        passwordHash: null,
        oauthProvider,
        oauthSubject,
        role: "EMPLOYEE",
        isPlatformAdmin: false,
        emailVerified: true,
        employee: {
          create: {
            name: displayName,
            jobTitle: "Staff",
            businessId: business.id,
            activationStatus: "active",
          },
        },
      },
      include: { employee: true },
    });
    return authResultForUserRecord(created);
  }

  throw new Error("Unsupported role for OAuth sign-up.");
}
