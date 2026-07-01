import type { BusinessKycStatus } from "./authSession";
import type { OnboardingVerificationStatus } from "./api";

/** Minimal shape for post-auth routing (login, refresh, OAuth). */
export type PostAuthRedirectUser = {
  isVerified: boolean;
  role: "business" | "employee" | "platform_admin" | "admin" | "user";
  hasCompletedOnboarding: boolean;
  /** Legacy KYC-derived status for go-live hints — not a dashboard gate. */
  status?: BusinessKycStatus;
  onboardingVerificationStatus?: OnboardingVerificationStatus;
};

/**
 * Canonical post-authentication destination.
 * Order: email verify → onboarding wizard → role home.
 * Platform onboarding approval does not block dashboard access (QR/go-live only).
 * KYC is financial/compliance only and does not block dashboard access.
 */
export function getPostAuthRedirect(u: PostAuthRedirectUser): string {
  if (!u.isVerified) return "/verify-email";

  if (u.role === "business") {
    if (!u.hasCompletedOnboarding) return "/onboarding";
    return "/dashboard";
  }

  if (u.role === "employee") return "/employee/dashboard";
  if (u.role === "platform_admin" || u.role === "admin") return "/platform-admin/dashboard";
  return "/dashboard";
}
