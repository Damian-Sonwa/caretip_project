import type { TFunction } from "i18next";
import type { KycVerificationStatus, OnboardingVerificationStatus } from "./api";

/** Admin / business UI labels — always name the workflow explicitly. */

export function onboardingStatusLabelKey(
  status: OnboardingVerificationStatus | null | undefined,
): string {
  const s = status ?? "draft";
  return `admin.onboardingVerificationPage.filters.status.${s}`;
}

export function kycStatusLabelKey(status: KycVerificationStatus | null | undefined): string {
  const s = status ?? "not_started";
  if (s === "pending_review") return "admin.businessDetailPage.kycStatus.pendingReview";
  if (s === "awaiting_upload") return "admin.businessDetailPage.kycStatus.awaitingUpload";
  if (s === "verified") return "admin.businessDetailPage.kycStatus.verified";
  if (s === "rejected") return "admin.businessDetailPage.kycStatus.rejected";
  return "admin.businessDetailPage.kycStatus.notStarted";
}

export function onboardingStatusLabel(
  status: OnboardingVerificationStatus | null | undefined,
  t: TFunction,
): string {
  const key = onboardingStatusLabelKey(status);
  const translated = t(key);
  return translated === key ? String(status ?? "draft") : translated;
}

export function kycStatusLabel(
  status: KycVerificationStatus | null | undefined,
  t: TFunction,
): string {
  return t(kycStatusLabelKey(status));
}

export function isOnboardingApprovedForGoLive(
  status: OnboardingVerificationStatus | null | undefined,
): boolean {
  return status == null || status === "approved";
}
