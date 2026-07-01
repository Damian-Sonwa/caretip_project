import type {
  BusinessVerificationStatus,
  KycVerificationStatus,
  OnboardingVerificationStatus,
} from "@prisma/client";
import { prisma } from "../prisma.js";
import { emitPlatformDataUpdated, emitVerificationUpdated } from "../socket/socketEmitters.js";
import { invalidatePlatformDashboardCache } from "./platform.service.js";
import { parseKycDocuments, hasRequiredKycDocuments } from "./kyc.service.js";

export type OnboardingVerificationAction = "approved" | "rejected" | "submitted";
export type KycVerificationAction = "verified" | "rejected" | "pending_review";

export type ReviewHistoryEntry = {
  status: string;
  at: string;
  note?: string | null;
};

export function parseReviewHistory(raw: unknown): ReviewHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is ReviewHistoryEntry => {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return typeof o.status === "string" && typeof o.at === "string";
    })
    .map((x) => ({
      status: x.status,
      at: x.at,
      note: typeof x.note === "string" ? x.note : null,
    }));
}

/** Legacy column kept for backward-compatible integrations — mirrors KYC outcome only. */
export function legacyVerificationStatusFromKyc(
  kyc: KycVerificationStatus,
): BusinessVerificationStatus {
  if (kyc === "verified") return "verified";
  if (kyc === "rejected") return "rejected";
  return "pending";
}

export function managerHasPlatformAccess(onboarding: OnboardingVerificationStatus): boolean {
  return onboarding === "approved";
}

export function onboardingActionToStatus(
  action: OnboardingVerificationAction,
): OnboardingVerificationStatus {
  switch (action) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "submitted":
      return "submitted";
    default:
      return "submitted";
  }
}

export function kycActionToStatus(action: KycVerificationAction): KycVerificationStatus {
  switch (action) {
    case "verified":
      return "verified";
    case "rejected":
      return "rejected";
    case "pending_review":
      return "pending_review";
    default:
      return "pending_review";
  }
}

export async function submitBusinessOnboardingForReview(userId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { userId },
    select: { id: true, onboardingVerificationStatus: true },
  });
  if (!business) return;
  if (business.onboardingVerificationStatus === "approved") return;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      onboardingVerificationStatus: "submitted",
      onboardingSubmittedAt: new Date(),
    },
  });
  invalidatePlatformDashboardCache();
  emitPlatformDataUpdated("onboarding_submitted");
}

export async function updateOnboardingVerificationStatus(
  businessId: string,
  action: OnboardingVerificationAction,
  opts?: { reviewNote?: string | null; adminUserId?: string },
): Promise<void> {
  const previous = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      onboardingVerificationStatus: true,
      onboardingReviewHistory: true,
      name: true,
      userId: true,
    },
  });
  if (!previous) throw new Error("Business not found");

  const nextStatus = onboardingActionToStatus(action);
  const note = opts?.reviewNote?.trim() || null;
  const history = parseReviewHistory(previous.onboardingReviewHistory);
  if (previous.onboardingVerificationStatus !== nextStatus) {
    history.push({ status: nextStatus, at: new Date().toISOString(), note });
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      onboardingVerificationStatus: nextStatus,
      ...(note ? { onboardingReviewNotes: note } : {}),
      onboardingReviewHistory: history,
    },
  });

  invalidatePlatformDashboardCache();
  emitPlatformDataUpdated("onboarding_verification_status");

  if (previous.onboardingVerificationStatus !== nextStatus && previous.userId) {
    // Push notifications for KYC use onBusinessVerificationStatusChanged; onboarding uses platform events.
  }
}

export async function updateKycVerificationStatus(
  businessId: string,
  action: KycVerificationAction,
  opts?: { reviewNote?: string | null; adminUserId?: string },
): Promise<void> {
  const previous = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      kycVerificationStatus: true,
      kycReviewHistory: true,
      name: true,
      userId: true,
    },
  });
  if (!previous) throw new Error("Business not found");

  const nextKyc = kycActionToStatus(action);
  const legacyStatus = legacyVerificationStatusFromKyc(nextKyc);
  const note = opts?.reviewNote?.trim() || null;
  const history = parseReviewHistory(previous.kycReviewHistory);
  if (previous.kycVerificationStatus !== nextKyc) {
    history.push({ status: nextKyc, at: new Date().toISOString(), note });
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      kycVerificationStatus: nextKyc,
      verificationStatus: legacyStatus,
      ...(note ? { kycReviewNotes: note } : {}),
      kycReviewHistory: history,
    },
  });

  emitVerificationUpdated(businessId, legacyStatus);
  invalidatePlatformDashboardCache();
  emitPlatformDataUpdated("kyc_verification_status");

  if (previous.kycVerificationStatus !== nextKyc && previous.userId) {
    void import("./push/notification.triggers.js").then(({ onBusinessVerificationStatusChanged }) => {
      onBusinessVerificationStatusChanged({
        businessId,
        businessName: previous.name?.trim() || "Your venue",
        managerUserId: previous.userId!,
        previousStatus: legacyVerificationStatusFromKyc(previous.kycVerificationStatus),
        nextStatus: legacyStatus,
      });
    });
  }
}

export async function getOnboardingQueueMetrics() {
  const { getOnboardingQueueMetrics: countOnboardingMetrics } = await import(
    "./platformBusinessList.service.js"
  );
  return countOnboardingMetrics();
}

export async function refreshKycStatusFromDocuments(businessId: string): Promise<KycVerificationStatus> {
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      kycVerificationStatus: true,
      kycDocuments: true,
      kycSubmittedAt: true,
    },
  });
  if (!b) return "not_started";
  if (b.kycVerificationStatus === "verified" || b.kycVerificationStatus === "rejected") {
    return b.kycVerificationStatus;
  }
  const docs = parseKycDocuments(b.kycDocuments);
  let next: KycVerificationStatus = "not_started";
  if (b.kycSubmittedAt) next = "pending_review";
  else if (hasRequiredKycDocuments(docs)) next = "awaiting_upload";

  if (next !== b.kycVerificationStatus) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        kycVerificationStatus: next,
        verificationStatus: legacyVerificationStatusFromKyc(next),
      },
    });
  }
  return next;
}
