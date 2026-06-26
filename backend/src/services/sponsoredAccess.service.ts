import { SponsoredAccessStatus } from "@prisma/client";
import {
  getSponsoredProgrammeDefinition,
  isSponsoredCapabilityProfileKey,
  isSponsoredProgrammeKey,
  resolveEffectiveCapabilityProfileKey,
  type SponsoredCapabilityProfileKey,
  type SponsoredProgrammeKey,
} from "../config/sponsoredAccess.config.js";
import { prisma } from "../prisma.js";

export type SponsoredAccessGrantDto = {
  id: string;
  businessId: string;
  programmeKey: string;
  programmeLabelKey: string;
  capabilityProfileKey: string | null;
  effectiveProfileKey: SponsoredCapabilityProfileKey | null;
  status: SponsoredAccessStatus;
  approvedAt: string | null;
  approvedByUserId: string | null;
  approvedByEmail: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type GrantRow = {
  id: string;
  businessId: string;
  programmeKey: string;
  capabilityProfileKey: string | null;
  status: SponsoredAccessStatus;
  approvedAt: Date | null;
  approvedByUserId: string | null;
  approvedBy?: { email: string } | null;
  expiresAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(row: GrantRow): SponsoredAccessGrantDto {
  const def = getSponsoredProgrammeDefinition(row.programmeKey);
  const effectiveProfileKey = resolveEffectiveCapabilityProfileKey(
    row.programmeKey,
    row.capabilityProfileKey,
  );
  return {
    id: row.id,
    businessId: row.businessId,
    programmeKey: row.programmeKey,
    programmeLabelKey: def?.labelKey ?? "sponsored.programmes.generic",
    capabilityProfileKey: row.capabilityProfileKey,
    effectiveProfileKey,
    status: row.status,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedByUserId: row.approvedByUserId,
    approvedByEmail: row.approvedBy?.email ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function expireGrantIfNeeded(grant: {
  id: string;
  expiresAt: Date | null;
  status: SponsoredAccessStatus;
}): Promise<boolean> {
  if (grant.status !== SponsoredAccessStatus.active) return false;
  if (!grant.expiresAt || grant.expiresAt > new Date()) return false;
  await prisma.sponsoredAccessGrant.update({
    where: { id: grant.id },
    data: { status: SponsoredAccessStatus.expired },
  });
  return true;
}

/** Active, non-expired grant for entitlement resolution — never reads businessType. */
export async function findActiveSponsoredGrantForBusiness(businessId: string) {
  const grants = await prisma.sponsoredAccessGrant.findMany({
    where: {
      businessId,
      status: SponsoredAccessStatus.active,
    },
    orderBy: { approvedAt: "desc" },
    take: 5,
  });

  for (const grant of grants) {
    if (await expireGrantIfNeeded(grant)) continue;
    if (!getSponsoredProgrammeDefinition(grant.programmeKey)) continue;
    return grant;
  }
  return null;
}

export async function listSponsoredGrantsForBusiness(
  businessId: string,
): Promise<SponsoredAccessGrantDto[]> {
  const rows = await prisma.sponsoredAccessGrant.findMany({
    where: { businessId },
    include: {
      approvedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDto);
}

export async function createSponsoredAccessGrant(params: {
  businessId: string;
  programmeKey: SponsoredProgrammeKey;
  capabilityProfileKey?: SponsoredCapabilityProfileKey | null;
  notes?: string | null;
  expiresAt?: Date | null;
  activate?: boolean;
  approvedByUserId?: string | null;
}): Promise<SponsoredAccessGrantDto> {
  if (!isSponsoredProgrammeKey(params.programmeKey)) {
    throw new Error("Unknown sponsored programme key");
  }
  if (
    params.capabilityProfileKey != null &&
    !isSponsoredCapabilityProfileKey(params.capabilityProfileKey)
  ) {
    throw new Error("Unknown capability profile key");
  }

  const row = await prisma.sponsoredAccessGrant.create({
    data: {
      businessId: params.businessId,
      programmeKey: params.programmeKey,
      capabilityProfileKey: params.capabilityProfileKey ?? null,
      notes: params.notes?.trim() || null,
      expiresAt: params.expiresAt ?? null,
      status: params.activate ? SponsoredAccessStatus.active : SponsoredAccessStatus.pending,
      approvedAt: params.activate ? new Date() : null,
      approvedByUserId: params.activate ? params.approvedByUserId ?? null : null,
    },
    include: {
      approvedBy: { select: { email: true } },
    },
  });

  if (params.activate) {
    await revokeOtherActiveGrants(params.businessId, row.id);
  }

  return toDto(row);
}

async function revokeOtherActiveGrants(businessId: string, exceptId: string): Promise<void> {
  await prisma.sponsoredAccessGrant.updateMany({
    where: {
      businessId,
      status: SponsoredAccessStatus.active,
      id: { not: exceptId },
    },
    data: { status: SponsoredAccessStatus.revoked },
  });
}

export async function activateSponsoredAccessGrant(
  grantId: string,
  approvedByUserId: string,
): Promise<SponsoredAccessGrantDto> {
  const existing = await prisma.sponsoredAccessGrant.findUnique({ where: { id: grantId } });
  if (!existing) throw new Error("Sponsored access grant not found");
  if (!getSponsoredProgrammeDefinition(existing.programmeKey)) {
    throw new Error("Grant references an unknown programme key");
  }
  if (existing.status === SponsoredAccessStatus.revoked) {
    throw new Error("Cannot activate a revoked grant");
  }
  if (existing.status === SponsoredAccessStatus.expired) {
    throw new Error("Cannot activate an expired grant");
  }

  const row = await prisma.sponsoredAccessGrant.update({
    where: { id: grantId },
    data: {
      status: SponsoredAccessStatus.active,
      approvedAt: new Date(),
      approvedByUserId,
    },
    include: {
      approvedBy: { select: { email: true } },
    },
  });

  await revokeOtherActiveGrants(row.businessId, row.id);
  return toDto(row);
}

export async function revokeSponsoredAccessGrant(grantId: string): Promise<SponsoredAccessGrantDto> {
  const existing = await prisma.sponsoredAccessGrant.findUnique({ where: { id: grantId } });
  if (!existing) throw new Error("Sponsored access grant not found");

  const row = await prisma.sponsoredAccessGrant.update({
    where: { id: grantId },
    data: { status: SponsoredAccessStatus.revoked },
    include: {
      approvedBy: { select: { email: true } },
    },
  });
  return toDto(row);
}

export async function updateSponsoredAccessGrant(
  grantId: string,
  params: {
    programmeKey?: SponsoredProgrammeKey;
    capabilityProfileKey?: SponsoredCapabilityProfileKey | null;
    notes?: string | null;
    expiresAt?: Date | null;
    clearExpiresAt?: boolean;
  },
): Promise<SponsoredAccessGrantDto> {
  const existing = await prisma.sponsoredAccessGrant.findUnique({ where: { id: grantId } });
  if (!existing) throw new Error("Sponsored access grant not found");
  if (
    existing.status === SponsoredAccessStatus.revoked ||
    existing.status === SponsoredAccessStatus.expired
  ) {
    throw new Error("Cannot edit a revoked or expired grant");
  }

  const programmeKey = params.programmeKey ?? existing.programmeKey;
  if (!isSponsoredProgrammeKey(programmeKey)) {
    throw new Error("Unknown sponsored programme key");
  }

  let capabilityProfileKey = existing.capabilityProfileKey;
  if (params.capabilityProfileKey !== undefined) {
    if (
      params.capabilityProfileKey != null &&
      !isSponsoredCapabilityProfileKey(params.capabilityProfileKey)
    ) {
      throw new Error("Unknown capability profile key");
    }
    capabilityProfileKey = params.capabilityProfileKey;
  }

  let expiresAt = existing.expiresAt;
  if (params.clearExpiresAt) {
    expiresAt = null;
  } else if (params.expiresAt !== undefined) {
    expiresAt = params.expiresAt;
  }

  const row = await prisma.sponsoredAccessGrant.update({
    where: { id: grantId },
    data: {
      programmeKey,
      capabilityProfileKey,
      notes: params.notes !== undefined ? params.notes?.trim() || null : existing.notes,
      expiresAt,
    },
    include: {
      approvedBy: { select: { email: true } },
    },
  });

  return toDto(row);
}
