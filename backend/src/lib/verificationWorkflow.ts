import type {
  BusinessVerificationStatus,
  KycVerificationStatus,
  OnboardingVerificationStatus,
} from "@prisma/client";

/** Platform onboarding review — gates public QR / venue exposure. */
export function isOnboardingApprovedForPublicGoLive(
  status: OnboardingVerificationStatus | null | undefined,
): boolean {
  return status == null || status === "approved";
}

/** Map split KYC column to legacy mirror for payment eligibility only. */
export function kycStatusToLegacyMirror(
  status: KycVerificationStatus | null | undefined,
): BusinessVerificationStatus {
  if (status === "verified") return "verified";
  if (status === "rejected") return "rejected";
  return "pending";
}
