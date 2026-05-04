/** Logins provisioned by `npm run db:seed` walkthrough demo (`backend/prisma/seedWalkthroughDemo.ts`). */
export const WALKTHROUGH_DEMO_MANAGER_EMAIL = "demo@caretip.de";
export const WALKTHROUGH_DEMO_PLATFORM_ADMIN_EMAIL = "admin@caretip.de";

export function isWalkthroughDemoManager(
  user: { email: string; role: string } | null | undefined,
): boolean {
  if (!user || user.role !== "business") return false;
  return user.email.trim().toLowerCase() === WALKTHROUGH_DEMO_MANAGER_EMAIL;
}

export function isWalkthroughDemoPlatformAdmin(
  user: { email: string; role: string } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role !== "platform_admin" && user.role !== "admin") return false;
  return user.email.trim().toLowerCase() === WALKTHROUGH_DEMO_PLATFORM_ADMIN_EMAIL;
}
