import type { EmployeeActivationStatus } from "@prisma/client";
import { generateSlug, ensureUniqueSlug } from "../utils/slug.js";
import { prisma } from "../prisma.js";
import { emitBusinessDataChanged, emitPlatformDataUpdated } from "../socket/socketEmitters.js";
import { listEmployeeGoalsForBusiness } from "./goal.service.js";

/** Avoid collision with app routes under /business/... */
const RESERVED_BUSINESS_SLUGS = new Set([
  "dashboard",
  "qr-management",
  "qr-code-management",
]);

function normalizeBusinessSlugBase(name: string): string {
  let base = generateSlug(name);
  if (RESERVED_BUSINESS_SLUGS.has(base)) {
    base = `${base}-venue`;
  }
  return base;
}

/** Unique slug for a new business name (registration, seeds). */
export async function generateUniqueBusinessSlugForName(name: string): Promise<string> {
  const base = normalizeBusinessSlugBase(name);
  return ensureUniqueSlug(base, async (s) => {
    const hit = await prisma.business.findFirst({ where: { slug: s } });
    return !!hit;
  });
}

/** Backfill missing slugs for legacy rows (run before NOT NULL migrate if needed). */
export async function ensureBusinessHasSlug(businessId: string): Promise<void> {
  const b = await prisma.business.findUnique({ where: { id: businessId } });
  if (!b) return;
  if (b.slug && b.slug.length > 0) return;
  const base = normalizeBusinessSlugBase(b.name);
  const slug = await ensureUniqueSlug(base, async (s) => {
    const hit = await prisma.business.findFirst({ where: { slug: s } });
    return !!hit;
  });
  await prisma.business.update({ where: { id: businessId }, data: { slug } });
}

export async function getBusinessByUserId(userId: string) {
  const existing = await prisma.business.findUnique({ where: { userId } });
  if (existing) return existing;

  // Auto-heal: legacy or inconsistent rows where a MANAGER exists without a Business record.
  // This keeps the app usable and prevents "Business not found" / "Only business owners..." errors.
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isActive: true, isPlatformAdmin: true },
  });
  if (!u || !u.isActive || u.isPlatformAdmin || u.role !== "MANAGER") {
    return null;
  }

  const baseName = (u.email.split("@")[0] || "My").trim();
  const name = `${baseName} venue`;
  const slug = await generateUniqueBusinessSlugForName(name);
  return prisma.business.create({
    data: {
      userId: u.id,
      name,
      slug,
      businessType: null,
      location: null,
    },
  });
}

/**
 * Hard-delete a venue and every auth account tied to it:
 * all staff `User` rows (and their `Employee` rows via FK cascade), then the manager `User` row
 * (which cascades removal of the `Business` row per `businesses_user_id_fkey`).
 *
 * Call this instead of `prisma.business.delete` so staff manager accounts are not left orphaned.
 */
export async function deleteBusinessCascadeUsers(businessId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        userId: true,
        user: { select: { id: true, role: true, isPlatformAdmin: true } },
      },
    });
    if (!business) {
      throw new Error("Business not found");
    }
    if (business.user.isPlatformAdmin) {
      throw new Error("Cannot delete a business owned by a platform administrator account");
    }
    if (business.user.role !== "MANAGER") {
      throw new Error("Business owner user has unexpected role; delete aborted");
    }

    const employees = await tx.employee.findMany({
      where: { businessId },
      select: {
        userId: true,
        user: { select: { role: true, isPlatformAdmin: true } },
      },
    });

    const ownerUserId = business.userId;
    const staffUserIds: string[] = [];
    for (const row of employees) {
      if (row.userId === ownerUserId) {
        continue;
      }
      if (row.user.isPlatformAdmin) {
        throw new Error("Cannot delete business: a staff account is marked as platform administrator");
      }
      if (row.user.role !== "EMPLOYEE") {
        throw new Error("Business has a staff user with unexpected role; delete aborted");
      }
      staffUserIds.push(row.userId);
    }

    for (const uid of staffUserIds) {
      await tx.user.delete({ where: { id: uid } });
    }

    await tx.user.delete({ where: { id: ownerUserId } });
  });

  emitBusinessDataChanged(businessId, "business_deleted");
  emitPlatformDataUpdated("business_deleted");
}

/** Narrow lookup for dashboard — avoids SELECT * on `businesses` (P2022 when DB lags schema). */
export async function getBusinessIdForManagerUser(userId: string): Promise<{ id: string } | null> {
  return prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });
}

export async function generateInviteCode(userId: string): Promise<{
  inviteCode: string;
  expiresAt: string;
}> {
  const business = await prisma.business.findUnique({
    where: { userId },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  let inviteCode = "";
  let existing = true;
  while (existing) {
    inviteCode = String(Math.floor(100000 + Math.random() * 900000));
    const found = await prisma.business.findUnique({ where: { inviteCode } });
    existing = !!found;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.business.update({
    where: { id: business.id },
    data: {
      inviteCode,
      inviteCodeExpiresAt: expiresAt,
    },
  });

  return {
    inviteCode,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function validateInviteCode(code: string): Promise<{ ok: boolean; businessName?: string }> {
  const c = String(code ?? "").trim();
  if (!c) return { ok: false };
  const row = await prisma.business.findFirst({
    where: { inviteCode: c, inviteCodeExpiresAt: { gt: new Date() } },
    select: { name: true },
  });
  if (!row) return { ok: false };
  return { ok: true, businessName: row.name };
}

export type BusinessDashboardTimeframe = "week" | "month" | "year" | "all";

function utcRangeForTimeframe(
  tf: BusinessDashboardTimeframe,
  now = new Date()
): { start: Date; end: Date } | null {
  if (tf === "all") return null;

  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (tf === "year") {
    return {
      start: new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)),
    };
  }
  if (tf === "month") {
    return {
      start: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)),
    };
  }
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(y, m, d + mondayOffset, 0, 0, 0, 0));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function buildDailyTipDistribution(
  tipRows: { amount: unknown; createdAt: Date }[],
  tf: BusinessDashboardTimeframe,
  rangeStart: Date
): { day: string; amount: number }[] {
  const byDay = new Map<string, number>();
  for (const t of tipRows) {
    const key = t.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount));
  }

  const wdShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (tf === "week") {
    const out: { day: string; amount: number }[] = [];
    const start = new Date(rangeStart);
    for (let i = 0; i < 7; i++) {
      const cur = new Date(start);
      cur.setUTCDate(start.getUTCDate() + i);
      const key = cur.toISOString().slice(0, 10);
      out.push({ day: wdShort[i], amount: byDay.get(key) ?? 0 });
    }
    return out;
  }

  if (tf === "month") {
    const out: { day: string; amount: number }[] = [];
    const y = rangeStart.getUTCFullYear();
    const mo = rangeStart.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    for (let dom = 1; dom <= daysInMonth; dom++) {
      const cur = new Date(Date.UTC(y, mo, dom));
      const key = cur.toISOString().slice(0, 10);
      out.push({ day: String(dom), amount: byDay.get(key) ?? 0 });
    }
    return out;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthTotals = new Array(12).fill(0);
  for (const t of tipRows) {
    monthTotals[t.createdAt.getUTCMonth()] += Number(t.amount);
  }
  return monthNames.map((day, i) => ({ day, amount: monthTotals[i] }));
}

export async function getBusinessStats(
  businessId: string,
  timeframe: BusinessDashboardTimeframe = "month"
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      verificationStatus: true,
    },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  const range = utcRangeForTimeframe(timeframe);
  const rangeStart = range?.start ?? new Date(0);
  const rangeEnd = range?.end ?? new Date(8640000000000000);

  const tipRows = await prisma.transaction.findMany({
    where: {
      businessId,
      status: "success",
      ...(range ? { createdAt: { gte: range.start, lte: range.end } } : {}),
    },
    select: { amount: true, employeeId: true, createdAt: true },
  });

  const totalTips = tipRows.reduce((sum, t) => sum + Number(t.amount), 0);
  const tipCount = tipRows.length;

  const dailyTipDistribution = buildDailyTipDistribution(
    tipRows,
    timeframe,
    range?.start ?? rangeStart
  );

  const tipsByEmp = new Map<string, { total: number; count: number }>();
  for (const t of tipRows) {
    const cur = tipsByEmp.get(t.employeeId) ?? { total: 0, count: 0 };
    cur.total += Number(t.amount);
    cur.count += 1;
    tipsByEmp.set(t.employeeId, cur);
  }

  const legacyEmployeeSelect = {
    id: true,
    slug: true,
    name: true,
    jobTitle: true,
    avatar: true,
    phone: true,
    isActive: true,
    activationStatus: true,
    monthlyGoal: true,
    user: {
      select: {
        email: true,
        emailVerified: true,
        passwordHash: true,
        oauthProvider: true,
      },
    },
  } as const;

  const extendedEmployeeSelect = {
    ...legacyEmployeeSelect,
    locationId: true,
    tableAssignments: { select: { table: { select: { id: true } } } },
  } as const;

  let employees: Array<{
    id: string;
    slug: string | null;
    name: string;
    jobTitle: string;
    avatar: string | null;
    phone: string | null;
    isActive: boolean;
    activationStatus: EmployeeActivationStatus;
    monthlyGoal: unknown;
    user: {
      email: string;
      emailVerified: boolean;
      passwordHash: string | null;
      oauthProvider: string | null;
    };
    locationId?: string | null;
    tableAssignments?: { table: { id: string } }[];
  }>;

  /**
   * Owner dashboard / staff-management: every employee row for this business (not deleted),
   * including deactivated (`is_active` false), so the roster matches the database until removal.
   */
  const dashboardStaffWhere = { businessId };

  try {
    employees = await prisma.employee.findMany({
      where: dashboardStaffWhere,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: extendedEmployeeSelect,
    });
  } catch (extendedErr) {
    try {
      employees = await prisma.employee.findMany({
        where: dashboardStaffWhere,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        select: legacyEmployeeSelect,
      });
      console.warn(
        "[getBusinessStats] Extended employee select failed (DB may need migration); using legacy columns. Run: npm run db:migrate:deploy in backend.",
        extendedErr instanceof Error ? extendedErr.message : extendedErr
      );
    } catch {
      throw extendedErr;
    }
  }

  const employeeStats = employees.map((emp) => {
    const agg = tipsByEmp.get(emp.id) ?? { total: 0, count: 0 };
    const passwordIsSet =
      (emp.user.passwordHash != null && emp.user.passwordHash.length > 0) ||
      (emp.user.oauthProvider != null && emp.user.oauthProvider.trim().length > 0);
    return {
      id: emp.id,
      slug: emp.slug,
      name: emp.name,
      jobTitle: emp.jobTitle,
      avatar: emp.avatar,
      phone: emp.phone,
      isActive: emp.isActive,
      activationStatus: emp.activationStatus,
      email: emp.user.email,
      emailVerified: emp.user.emailVerified,
      passwordIsSet,
      monthlyGoal: emp.monthlyGoal != null ? Number(emp.monthlyGoal) : null,
      locationId: emp.locationId ?? null,
      assignedTableIds: emp.tableAssignments?.map((ta) => ta.table.id) ?? [],
      tipsTotal: agg.total,
      tipCount: agg.count,
      rating: agg.count > 0 ? 4.8 : null,
    };
  });

  let employeeGoals: Awaited<ReturnType<typeof listEmployeeGoalsForBusiness>> = [];
  try {
    employeeGoals = await listEmployeeGoalsForBusiness(businessId);
  } catch {
    /* optional: table missing before migration */
  }

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    verificationStatus: business.verificationStatus,
    timeframe,
    totalTips,
    tipCount,
    employeeCount: employees.length,
    dailyTipDistribution,
    employees: employeeStats,
    employeeGoals,
  };
}

/** All tips for a business (export); caller must ensure businessId is authorized. */
export async function getTipsForExport(businessId: string) {
  return prisma.transaction.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { id: true, name: true, jobTitle: true } },
    },
  });
}

/** Manager JWT: own venue only (same shape as public getById). */
export async function getManagerBusinessProfile(userId: string) {
  const b = await getBusinessByUserId(userId);
  if (!b) return null;
  return getBusinessById(b.id);
}

export async function updateManagerBusinessProfile(
  userId: string,
  data: {
    legalBusinessName?: string;
    businessType?: string | null;
    registeredAddress?: string | null;
    contactPhone?: string | null;
    website?: string | null;
  }
): Promise<{ id: string }> {
  const b = await getBusinessByUserId(userId);
  if (!b) {
    throw new Error("Business not found");
  }

  const nextName =
    typeof data.legalBusinessName === "string" ? data.legalBusinessName.trim() : undefined;
  const nextType = data.businessType !== undefined ? (data.businessType?.trim() || null) : undefined;
  const nextAddress =
    data.registeredAddress !== undefined ? (data.registeredAddress?.trim() || null) : undefined;
  const nextPhone =
    data.contactPhone !== undefined ? (data.contactPhone?.trim() || null) : undefined;
  const nextWebsite =
    data.website !== undefined ? (data.website?.trim() || null) : undefined;

  // If legal name changes, re-slug to match. This is safe pre-QR launch; later changes can be controlled.
  let nextSlug: string | undefined;
  if (nextName && nextName.length > 0 && nextName !== b.name) {
    nextSlug = await generateUniqueBusinessSlugForName(nextName);
  }

  await prisma.business.update({
    where: { id: b.id },
    data: {
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(nextType !== undefined ? { businessType: nextType } : {}),
      ...(nextAddress !== undefined ? { registeredAddress: nextAddress } : {}),
      ...(nextPhone !== undefined ? { contactPhone: nextPhone } : {}),
      ...(nextWebsite !== undefined ? { website: nextWebsite } : {}),
    },
    select: { id: true },
  });

  emitBusinessDataChanged(b.id, "business_profile_updated");
  return { id: b.id };
}

export async function getBusinessById(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      location: true,
      registeredAddress: true,
      verificationStatus: true,
    },
  });
  if (!business) return null;
  // Public-facing count: match directory/QR filters (active + activated + verified).
  const employeeCount = await prisma.employee.count({
    where: {
      businessId: business.id,
      isActive: true,
      activationStatus: "active",
      user: { is: { emailVerified: true } },
    },
  });
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    logo: null,
    location: business.location ?? "Downtown",
    registeredAddress: business.registeredAddress ?? null,
    type: business.businessType ?? "Restaurant",
    employeeCount,
    verificationStatus: business.verificationStatus,
  };
}

/** Rotate the public business slug so storefront QR becomes a new link. */
export async function regenerateManagerBusinessSlug(userId: string): Promise<{ slug: string }> {
  const b = await getBusinessByUserId(userId);
  if (!b) {
    throw new Error("Business not found");
  }
  // Keep it human-readable, but always create a new unique slug.
  const base = normalizeBusinessSlugBase(b.name);
  const slug = await ensureUniqueSlug(`${base}-${Math.random().toString(36).slice(2, 6)}`, async (s) => {
    const hit = await prisma.business.findFirst({ where: { slug: s } });
    return !!hit;
  });
  await prisma.business.update({ where: { id: b.id }, data: { slug } });
  emitBusinessDataChanged(b.id, "business_profile_updated");
  return { slug };
}
