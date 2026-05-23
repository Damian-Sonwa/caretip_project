import Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import {
  emitBusinessDataChanged,
  emitPlatformDataUpdated,
  emitVerificationUpdated,
} from "../socket/socketEmitters.js";
import { CARETIP_FEE_PERCENT } from "../config/fees.js";
import { signImpersonationToken } from "./auth.service.js";

export async function checkDatabaseHealth(): Promise<"online" | "offline"> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "online";
  } catch {
    return "offline";
  }
}

export async function checkStripeHealth(): Promise<"online" | "offline"> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "offline";
  try {
    const stripe = new Stripe(key);
    await stripe.balance.retrieve();
    return "online";
  } catch {
    return "offline";
  }
}

/** Per-business successful tip totals (live from `tips` / Transaction, keyed by businessId). */
async function getSuccessTipStatsForBusinessIds(
  ids: string[]
): Promise<Map<string, { totalTipsEur: number; successTipCount: number }>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.transaction.groupBy({
    by: ["businessId"],
    where: { status: "success", businessId: { in: ids } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const m = new Map<string, { totalTipsEur: number; successTipCount: number }>();
  for (const r of rows) {
    m.set(r.businessId, {
      totalTipsEur: Number(r._sum.amount ?? 0),
      successTipCount: r._count._all,
    });
  }
  return m;
}

/** Aggregates for SuperAdmin dashboard (EUR = tip amounts stored in DB). Platform tip total = SUM(success tips) across all businesses. */
export async function getGlobalPlatformStats() {
  const [
    totalVolumeAgg,
    transactionCount,
    successCount,
    businessesCount,
    employeesCount,
    locationsCount,
    usersActive,
    perBusinessSuccessTips,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "success" },
      _sum: { amount: true },
    }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: "success" } }),
    prisma.business.count(),
    prisma.employee.count(),
    prisma.location.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.transaction.groupBy({
      by: ["businessId"],
      where: { status: "success" },
      _sum: { amount: true },
    }),
  ]);

  const totalVolumeEur = Number(totalVolumeAgg._sum.amount ?? 0);
  const platformTotalFromBusinessRollup = perBusinessSuccessTips.reduce(
    (s, r) => s + Number(r._sum.amount ?? 0),
    0
  );
  const rollupMatches =
    Math.round(totalVolumeEur * 100) === Math.round(platformTotalFromBusinessRollup * 100);

  return {
    totalVolumeEur,
    totalVolumeEurFormatted: totalVolumeEur.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    transactionCount,
    successTransactionCount: successCount,
    businessesCount,
    employeesCount,
    locationsCount,
    activeUsersCount: usersActive,
    businessesWithSuccessfulTips: perBusinessSuccessTips.length,
    /** Sum of successful tip amounts grouped by business; should equal totalVolumeEur. */
    platformTotalTipsFromBusinessRollupEur: platformTotalFromBusinessRollup,
    platformTotalsConsistent: rollupMatches,
  };
}

export async function listGlobalTransactions(params: {
  q?: string;
  take: number;
  skip: number;
}) {
  const where: Prisma.TransactionWhereInput = {};
  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { stripePaymentIntentId: { contains: q, mode: "insensitive" } },
      { business: { name: { contains: q, mode: "insensitive" } } },
      { employee: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.take,
      skip: params.skip,
      include: {
        business: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const feeRate = CARETIP_FEE_PERCENT / 100;
  const items = rows.map((t) => {
    const gross = Number(t.amount);
    const feeAmount = Math.round(gross * feeRate * 100) / 100;
    const netToStaff = Math.round((gross - feeAmount) * 100) / 100;
    return {
      id: t.id,
      amountEur: gross,
      caretipFeePercent: CARETIP_FEE_PERCENT,
      caretipFeeEur: feeAmount,
      netToStaffEur: netToStaff,
      payoutStatus: t.payoutStatus,
      tipStatus: t.status,
      stripePaymentIntentId: t.stripePaymentIntentId,
      createdAt: t.createdAt.toISOString(),
      businessId: t.businessId,
      businessName: t.business.name,
      employeeName: t.employee.name,
    };
  });

  return { items, total };
}

/**
 * SuperAdmin “all businesses” view: KYC fields plus live staff/location counts and successful tip totals per business.
 */
export async function getAllBusinessActivity() {
  const businesses = await prisma.business.findMany({
    orderBy: { name: "asc" },
    include: {
      user: { select: { id: true, email: true } },
      _count: { select: { employees: true, locations: true } },
    },
  });

  const tipStats = await getSuccessTipStatsForBusinessIds(businesses.map((b) => b.id));

  return businesses.map((b) => {
    const tips = tipStats.get(b.id) ?? { totalTipsEur: 0, successTipCount: 0 };
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      verificationStatus: b.verificationStatus,
      legalContactName: b.legalContactName,
      contactEmail: b.contactEmail,
      contactPhone: b.contactPhone,
      website: (b as any).website ?? null,
      registeredAddress: b.registeredAddress,
      ownerUserId: b.user.id,
      ownerEmail: b.user.email,
      staffCount: b._count.employees,
      locationCount: b._count.locations,
      logoPath: b.logoPath,
      verificationDocumentPath: b.verificationDocumentPath,
      totalTipsEur: tips.totalTipsEur,
      successTipCount: tips.successTipCount,
    };
  });
}

/** @deprecated use getAllBusinessActivity */
export async function listBusinessesForAdmin() {
  return getAllBusinessActivity();
}

export async function updateBusinessVerificationStatus(
  businessId: string,
  status: "pending" | "verified" | "rejected"
) {
  await prisma.business.update({
    where: { id: businessId },
    data: { verificationStatus: status },
  });
  emitVerificationUpdated(businessId, status);
  emitPlatformDataUpdated("verification_status");
}

/** @deprecated prefer updateBusinessVerificationStatus */
export async function verifyBusiness(businessId: string) {
  await updateBusinessVerificationStatus(businessId, "verified");
}

export async function getBusinessForAdmin(businessId: string) {
  const [b, tipSum, successTipCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { employees: true, locations: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: { businessId, status: "success" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { businessId, status: "success" } }),
  ]);
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    verificationStatus: b.verificationStatus,
    legalContactName: b.legalContactName,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    website: (b as any).website ?? null,
    registeredAddress: b.registeredAddress,
    ownerUserId: b.user.id,
    ownerEmail: b.user.email,
    staffCount: b._count.employees,
    locationCount: b._count.locations,
    logoPath: b.logoPath,
    verificationDocumentPath: b.verificationDocumentPath,
    totalTipsEur: Number(tipSum._sum.amount ?? 0),
    successTipCount,
  };
}

export async function listAuditLogsForAdmin(params: { take: number; skip: number }) {
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: params.take,
      skip: params.skip,
      include: { user: { select: { email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      userEmail: r.user.email,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

export async function updateBusinessKyc(
  businessId: string,
  data: {
    legalContactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    website?: string | null;
    registeredAddress?: string | null;
  }
) {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(data.legalContactName !== undefined && { legalContactName: data.legalContactName }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.registeredAddress !== undefined && { registeredAddress: data.registeredAddress }),
    },
  });
  const refreshed = await getBusinessForAdmin(businessId);
  if (!refreshed) throw new Error("Business not found");
  emitBusinessDataChanged(businessId, "kyc_updated");
  emitPlatformDataUpdated("kyc_updated");
  return refreshed;
}

export async function setBusinessLogoPath(businessId: string, publicPath: string) {
  await prisma.business.update({
    where: { id: businessId },
    data: { logoPath: publicPath },
  });
  emitBusinessDataChanged(businessId, "logo_updated");
  emitPlatformDataUpdated("business_logo");
}

export async function setBusinessVerificationDocumentPath(businessId: string, publicPath: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  await prisma.business.update({
    where: { id: businessId },
    data: { verificationDocumentPath: publicPath },
  });
  emitBusinessDataChanged(businessId, "verification_doc_updated");
  emitPlatformDataUpdated("verification_document");
  if (business?.name) {
    const { onBusinessVerificationDocumentUploaded } = await import(
      "./push/notification.triggers.js"
    );
    onBusinessVerificationDocumentUploaded(businessId, business.name);
  }
}

export type PlatformAnnouncementAudience = "all" | "managers" | "employees";

export async function resolveAnnouncementRecipientIds(
  audience: PlatformAnnouncementAudience,
): Promise<string[]> {
  const roleFilter =
    audience === "managers"
      ? { role: "MANAGER" as const }
      : audience === "employees"
        ? { role: "EMPLOYEE" as const }
        : { role: { in: ["MANAGER", "EMPLOYEE"] as const } };
  const rows = await prisma.user.findMany({
    where: { ...roleFilter, isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Push broadcast to managers and/or employees (FCM). */
export async function sendPlatformAnnouncement(input: {
  title: string;
  body: string;
  url?: string;
  audience: PlatformAnnouncementAudience;
  announcementId?: string;
}): Promise<{ recipientCount: number }> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw new Error("title and body are required");
  }
  const userIds = await resolveAnnouncementRecipientIds(input.audience);
  const { onAdminAnnouncement } = await import("./push/notification.triggers.js");
  onAdminAnnouncement({
    userIds,
    title,
    body,
    url: input.url?.trim() || undefined,
    announcementId: input.announcementId,
  });
  return { recipientCount: userIds.length };
}

export async function impersonateBusinessManager(
  platformAdminUserId: string,
  businessId: string
) {
  const admin = await prisma.user.findUnique({ where: { id: platformAdminUserId } });
  if (!admin || admin.role !== "SUPER_ADMIN" || !admin.isPlatformAdmin) {
    throw new Error("Forbidden");
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { user: true },
  });
  if (!business) {
    throw new Error("Business not found");
  }

  const token = signImpersonationToken(business.userId, business.user.email, platformAdminUserId);

  return {
    token,
    user: {
      id: business.user.id,
      email: business.user.email,
      role: "MANAGER" as const,
      name: business.name,
      businessId: business.id,
      impersonation: true as const,
      impersonatedBy: platformAdminUserId,
    },
  };
}
