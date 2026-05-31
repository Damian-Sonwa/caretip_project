import { prisma } from "../prisma.js";
import type { WelcomeAccountKind } from "./i18nEmail.js";

export type EmailPersonalization = {
  recipientName: string | null;
  businessName: string | null;
  accountKind: WelcomeAccountKind;
};

/** Loads display names for transactional email greetings (safe fallbacks). */
export async function resolveEmailPersonalizationForUser(
  userId: string,
): Promise<EmailPersonalization> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      business: { select: { name: true, legalContactName: true } },
      employee: {
        select: {
          name: true,
          business: { select: { name: true } },
        },
      },
    },
  });

  if (!user) {
    return { recipientName: null, businessName: null, accountKind: "other" };
  }

  const businessName =
    user.business?.name?.trim() || user.employee?.business?.name?.trim() || null;
  const recipientName =
    user.employee?.name?.trim() ||
    user.business?.legalContactName?.trim() ||
    null;

  const accountKind: WelcomeAccountKind =
    user.role === "EMPLOYEE"
      ? "employee"
      : user.role === "MANAGER"
        ? "manager"
        : "other";

  return { recipientName, businessName, accountKind };
}
