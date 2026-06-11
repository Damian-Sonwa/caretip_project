import type { BusinessKycStatus } from "./authSession";

/** Minimal shape for post-auth routing (login, refresh, OAuth). */
export type PostAuthRedirectUser = {
  isVerified: boolean;
  role: "business" | "employee" | "platform_admin" | "admin" | "user";
  hasCompletedOnboarding: boolean;
  status?: BusinessKycStatus;
};

/**
 * Canonical post-authentication destination.
 * Order: email verify → onboarding → KYC pending/rejected → role home.
 */
export function getPostAuthRedirect(u: PostAuthRedirectUser): string {
  if (!u.isVerified) return "/verify-email";

  if (u.role === "business") {
    if (!u.hasCompletedOnboarding) return "/onboarding";
    if (u.status === "PENDING" || u.status === "REJECTED") return "/verification-pending";
    return "/dashboard";
  }

  if (u.role === "employee") return "/employee/dashboard";
  if (u.role === "platform_admin" || u.role === "admin") return "/platform-admin/dashboard";
  return "/dashboard";
}
