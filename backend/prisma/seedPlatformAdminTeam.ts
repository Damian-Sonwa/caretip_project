import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * Additional platform operators — same dashboard & data, separate logins and MFA.
 * DB role is SUPER_ADMIN + isPlatformAdmin (API label: platform_admin).
 */
export const PLATFORM_ADMIN_TEAM = [
  {
    email: "albertina@caretip.de",
    displayName: "Albertina",
    /** Change after first login. Override with ALBERTINA_ADMIN_TEMP_PASSWORD. */
    tempPassword: "caretip@2026!",
  },
  {
    email: "fanny@caretip.de",
    displayName: "Fanny",
    /** Change after first login. Override with FANNY_ADMIN_TEMP_PASSWORD. */
    tempPassword: "caretip@2026!",
  },
] as const;

export type SeedPlatformAdminTeamResult = {
  created: string[];
  updated: string[];
  passwordReset: string[];
  passwordPreserved: string[];
};

function resolveTempPassword(
  member: (typeof PLATFORM_ADMIN_TEAM)[number],
): string {
  const envKey =
    member.email === "albertina@caretip.de"
      ? process.env.ALBERTINA_ADMIN_TEMP_PASSWORD?.trim()
      : process.env.FANNY_ADMIN_TEMP_PASSWORD?.trim();
  return envKey && envKey.length >= 12 ? envKey : member.tempPassword;
}

/**
 * Idempotent: upserts team admins by email. Never creates tenants or duplicated platform data.
 * Preserves existing password + MFA secrets unless `resetPasswords` is true.
 */
export async function seedPlatformAdminTeam(
  prisma: PrismaClient,
  options: { resetPasswords?: boolean } = {},
): Promise<SeedPlatformAdminTeamResult> {
  const resetPasswords = options.resetPasswords === true;
  const result: SeedPlatformAdminTeamResult = {
    created: [],
    updated: [],
    passwordReset: [],
    passwordPreserved: [],
  };

  for (const member of PLATFORM_ADMIN_TEAM) {
    const email = member.email.toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    const shouldSetPassword = !existing || resetPasswords;
    const passwordHash = shouldSetPassword
      ? await bcrypt.hash(resolveTempPassword(member), 10)
      : undefined;

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: passwordHash!,
        role: "SUPER_ADMIN",
        isPlatformAdmin: true,
        isActive: true,
        emailVerified: true,
        hasCompletedOnboarding: true,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      },
      update: {
        role: "SUPER_ADMIN",
        isPlatformAdmin: true,
        isActive: true,
        emailVerified: true,
        hasCompletedOnboarding: true,
        ...(passwordHash ? { passwordHash } : {}),
        // Never wipe MFA on re-seed — each admin keeps their own authenticator setup.
      },
    });

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    if (!existing) {
      result.created.push(email);
      result.passwordReset.push(email);
    } else {
      result.updated.push(email);
      if (passwordHash) {
        result.passwordReset.push(email);
      } else {
        result.passwordPreserved.push(email);
      }
    }
  }

  return result;
}

export async function listPlatformAdminAccounts(prisma: PrismaClient) {
  return prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isPlatformAdmin: true },
    select: {
      email: true,
      isActive: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
