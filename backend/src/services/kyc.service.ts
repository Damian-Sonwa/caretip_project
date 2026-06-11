import type { BusinessVerificationStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { emitBusinessDataChanged } from "../socket/socketEmitters.js";
import { emitPlatformDataUpdated } from "../socket/socketEmitters.js";

export type KycDocumentType = "registration" | "address" | "governmentId" | "additional";

export type KycDocuments = {
  registration?: string | null;
  address?: string | null;
  governmentId?: string | null;
  additional?: string[];
};

export type KycUiStatus = "PENDING_UPLOAD" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type KycTimelineEntry = {
  status: KycUiStatus | "SUBMITTED";
  at: string;
  label: string;
};

const REQUIRED_TYPES: KycDocumentType[] = ["registration", "address", "governmentId"];

export function parseKycDocuments(raw: unknown): KycDocuments {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const additional = Array.isArray(o.additional)
    ? o.additional.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : undefined;
  return {
    registration: typeof o.registration === "string" ? o.registration : null,
    address: typeof o.address === "string" ? o.address : null,
    governmentId: typeof o.governmentId === "string" ? o.governmentId : null,
    additional,
  };
}

export function hasRequiredKycDocuments(docs: KycDocuments): boolean {
  return REQUIRED_TYPES.every((t) => {
    const v = docs[t];
    return typeof v === "string" && v.trim().length > 0;
  });
}

export function resolveKycUiStatus(input: {
  verificationStatus: BusinessVerificationStatus;
  kycDocuments: KycDocuments | null;
  kycSubmittedAt: Date | null;
}): KycUiStatus {
  if (input.verificationStatus === "verified") return "APPROVED";
  if (input.verificationStatus === "rejected") return "REJECTED";
  const docs = input.kycDocuments ?? {};
  if (hasRequiredKycDocuments(docs) && input.kycSubmittedAt) {
    return "UNDER_REVIEW";
  }
  if (hasRequiredKycDocuments(docs)) {
    return "UNDER_REVIEW";
  }
  return "PENDING_UPLOAD";
}

export function buildKycTimeline(input: {
  kycSubmittedAt: Date | null;
  verificationStatus: BusinessVerificationStatus;
  kycUiStatus: KycUiStatus;
  updatedAt?: Date | null;
}): KycTimelineEntry[] {
  const entries: KycTimelineEntry[] = [];
  if (input.kycSubmittedAt) {
    entries.push({
      status: "SUBMITTED",
      at: input.kycSubmittedAt.toISOString(),
      label: "Documents submitted for review",
    });
  }
  if (input.kycUiStatus === "UNDER_REVIEW") {
    entries.push({
      status: "UNDER_REVIEW",
      at: (input.kycSubmittedAt ?? input.updatedAt ?? new Date()).toISOString(),
      label: "Under admin review",
    });
  }
  if (input.verificationStatus === "verified") {
    entries.push({
      status: "APPROVED",
      at: (input.updatedAt ?? new Date()).toISOString(),
      label: "Venue approved",
    });
  }
  if (input.verificationStatus === "rejected") {
    entries.push({
      status: "REJECTED",
      at: (input.updatedAt ?? new Date()).toISOString(),
      label: "Verification rejected — upload again",
    });
  }
  if (entries.length === 0) {
    entries.push({
      status: "PENDING_UPLOAD",
      at: new Date().toISOString(),
      label: "Upload required documents",
    });
  }
  return entries;
}

export async function getManagerKycStatus(userId: string) {
  const business = await prisma.business.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      verificationDocumentPath: true,
      kycDocuments: true,
      kycSubmittedAt: true,
    },
  });
  if (!business) {
    throw new Error("Business not found");
  }

  const kycDocuments = parseKycDocuments(business.kycDocuments);
  const kycUiStatus = resolveKycUiStatus({
    verificationStatus: business.verificationStatus,
    kycDocuments,
    kycSubmittedAt: business.kycSubmittedAt,
  });

  return {
    businessId: business.id,
    verificationStatus: business.verificationStatus,
    kycUiStatus,
    kycDocuments,
    kycSubmittedAt: business.kycSubmittedAt?.toISOString() ?? null,
    legacyVerificationDocumentPath: business.verificationDocumentPath,
    requiredDocumentTypes: REQUIRED_TYPES,
    timeline: buildKycTimeline({
      kycSubmittedAt: business.kycSubmittedAt,
      verificationStatus: business.verificationStatus,
      kycUiStatus,
    }),
  };
}

export async function upsertManagerKycDocument(
  userId: string,
  documentType: KycDocumentType,
  publicPath: string,
): Promise<{ kycUiStatus: KycUiStatus; kycDocuments: KycDocuments }> {
  const business = await prisma.business.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      kycDocuments: true,
      kycSubmittedAt: true,
    },
  });
  if (!business) {
    throw new Error("Business not found");
  }

  const docs = parseKycDocuments(business.kycDocuments);
  if (documentType === "additional") {
    docs.additional = [...(docs.additional ?? []), publicPath];
  } else {
    docs[documentType] = publicPath;
  }

  const nextStatus: BusinessVerificationStatus =
    business.verificationStatus === "rejected" ? "pending" : business.verificationStatus;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      kycDocuments: docs,
      verificationStatus: nextStatus,
      verificationDocumentPath: publicPath,
    },
  });

  emitBusinessDataChanged(business.id, "verification_doc_updated");
  emitPlatformDataUpdated("verification_document");

  const { onBusinessVerificationDocumentUploaded } = await import(
    "./push/notification.triggers.js"
  );
  if (business.name) {
    onBusinessVerificationDocumentUploaded(business.id, business.name);
  }

  const kycUiStatus = resolveKycUiStatus({
    verificationStatus: nextStatus,
    kycDocuments: docs,
    kycSubmittedAt: business.kycSubmittedAt,
  });

  return { kycUiStatus, kycDocuments: docs };
}

export async function submitManagerKycForReview(userId: string) {
  const business = await prisma.business.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      kycDocuments: true,
    },
  });
  if (!business) {
    throw new Error("Business not found");
  }

  const docs = parseKycDocuments(business.kycDocuments);
  if (!hasRequiredKycDocuments(docs)) {
    throw new Error("Upload business registration, proof of address, and government ID before submitting.");
  }

  const now = new Date();
  await prisma.business.update({
    where: { id: business.id },
    data: {
      kycSubmittedAt: now,
      verificationStatus: "pending",
      kycDocuments: docs,
    },
  });

  emitBusinessDataChanged(business.id, "kyc_submitted");
  emitPlatformDataUpdated("kyc_submitted");

  const { onBusinessVerificationDocumentUploaded } = await import(
    "./push/notification.triggers.js"
  );
  if (business.name) {
    onBusinessVerificationDocumentUploaded(business.id, business.name);
  }

  return getManagerKycStatus(userId);
}

export function parseKycDocumentType(raw: unknown): KycDocumentType | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "registration" || t === "address" || t === "governmentId" || t === "additional") {
    return t;
  }
  return null;
}
