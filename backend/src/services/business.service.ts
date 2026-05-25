import { TipStatus, type EmployeeActivationStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { StatsFetchError, logStatsPhase } from "../utils/statsErrors.js";
import { randomBytes } from "node:crypto";
import { generateSlug, ensureUniqueSlug } from "../utils/slug.js";
import { prisma } from "../prisma.js";
import { emitBusinessDataChanged, emitPlatformDataUpdated } from "../socket/socketEmitters.js";
import { listEmployeeGoalsForBusiness } from "./goal.service.js";
import { PUBLIC_APP_RESERVED_SLUGS } from "../utils/publicReservedSlugs.js";
import { absolutizePublicMediaPath } from "../utils/publicMediaUrl.js";
import {
  businessDayKey,
  businessUtcRangeForTimeframe,
  sanitizeIanaTimezone,
} from "../utils/businessTime.js";
import { getCachedOrLoad, invalidateCacheKeyPrefix } from "../utils/shortLivedCache.js";

const BUSINESS_STATS_CACHE_TTL_MS = 30_000;

/** Avoid collision with SPA routes at `/{slug}` and legacy `/business/{slug}` paths. */
const RESERVED_BUSINESS_SLUGS = new Set([
  ...PUBLIC_APP_RESERVED_SLUGS,
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

function buildDailyTipDistribution(
  tipRows: { amount: unknown; createdAt: Date }[],
  tf: BusinessDashboardTimeframe,
  rangeStartUtc: Date,
  businessTimezone: string,
): { day: string; amount: number }[] {
  const byDay = new Map<string, number>();
  for (const t of tipRows) {
    const key = businessDayKey(t.createdAt, businessTimezone);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount));
  }

  const tz = sanitizeIanaTimezone(businessTimezone);

  if (tf === "week") {
    const out: { day: string; amount: number }[] = [];
    let cur = DateTime.fromJSDate(rangeStartUtc, { zone: "utc" }).setZone(tz).startOf("day");
    for (let i = 0; i < 7; i++) {
      const key = cur.toFormat("yyyy-LL-dd");
      out.push({ day: cur.toFormat("ccc"), amount: byDay.get(key) ?? 0 });
      cur = cur.plus({ days: 1 });
    }
    return out;
  }

  if (tf === "month") {
    const out: { day: string; amount: number }[] = [];
    const monthStart = DateTime.fromJSDate(rangeStartUtc, { zone: "utc" }).setZone(tz).startOf("month");
    const daysInMonth = monthStart.daysInMonth ?? 31;
    for (let dom = 0; dom < daysInMonth; dom++) {
      const cur = monthStart.plus({ days: dom });
      const key = cur.toFormat("yyyy-LL-dd");
      out.push({ day: String(dom + 1), amount: byDay.get(key) ?? 0 });
    }
    return out;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthTotals = new Array(12).fill(0);
  for (const t of tipRows) {
    const key = businessDayKey(t.createdAt, businessTimezone);
    const monthIdx = Number(key.slice(5, 7)) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      monthTotals[monthIdx] += Number(t.amount);
    }
  }
  return monthNames.map((day, i) => ({ day, amount: monthTotals[i] }));
}

const MONTH_CHART_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Monthly buckets for year/all charts — Prisma-only (avoids PG enum casting issues in raw SQL). */
async function monthlyTipTotalsForRange(
  businessId: string,
  startUtc: Date,
  endUtc: Date,
  businessTimezone: string,
): Promise<number[]> {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const monthTotals = new Array(12).fill(0);
  const tips = await prisma.transaction.findMany({
    where: {
      businessId,
      status: TipStatus.success,
      createdAt: { gte: startUtc, lte: endUtc },
    },
    select: { amount: true, createdAt: true },
  });
  for (const t of tips) {
    const key = businessDayKey(t.createdAt, tz);
    const monthIdx = Number(key.slice(5, 7)) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      monthTotals[monthIdx] += Number(t.amount);
    }
  }
  return monthTotals;
}

function buildYearChartFromMonthTotals(monthTotals: number[]): { day: string; amount: number }[] {
  return MONTH_CHART_LABELS.map((day, i) => ({ day, amount: monthTotals[i] ?? 0 }));
}

export type BusinessStatsScope = "summary" | "analytics" | "full";

export function invalidateBusinessStatsCache(businessId: string): void {
  invalidateCacheKeyPrefix(`business-stats:${businessId}:`);
  invalidateCacheKeyPrefix(`business-stats-summary:${businessId}:`);
  invalidateCacheKeyPrefix(`business-stats-analytics:${businessId}:`);
}

export function getBusinessStats(
  businessId: string,
  timeframe: BusinessDashboardTimeframe = "month",
  scope: BusinessStatsScope = "full",
): Promise<Awaited<ReturnType<typeof getBusinessStatsImpl>>> {
  if (scope === "summary") {
    const cacheKey = `business-stats-summary:${businessId}:${timeframe}`;
    return getCachedOrLoad(cacheKey, BUSINESS_STATS_CACHE_TTL_MS, () =>
      getBusinessStatsSummaryImpl(businessId, timeframe),
    ) as Promise<Awaited<ReturnType<typeof getBusinessStatsImpl>>>;
  }
  if (scope === "analytics") {
    const cacheKey = `business-stats-analytics:${businessId}:${timeframe}`;
    return getCachedOrLoad(cacheKey, BUSINESS_STATS_CACHE_TTL_MS, () =>
      getBusinessStatsAnalyticsImpl(businessId, timeframe),
    ) as Promise<Awaited<ReturnType<typeof getBusinessStatsImpl>>>;
  }
  const cacheKey = `business-stats:${businessId}:${timeframe}`;
  return getCachedOrLoad(cacheKey, BUSINESS_STATS_CACHE_TTL_MS, () =>
    getBusinessStatsImpl(businessId, timeframe),
  );
}

type BusinessStatsContext = {
  business: {
    id: string;
    name: string;
    slug: string | null;
    verificationStatus: string;
    timezone: string | null;
  };
  tz: string;
  timeframe: BusinessDashboardTimeframe;
  tipWhere: {
    businessId: string;
    status: typeof TipStatus.success;
    createdAt?: { gte: Date; lte: Date };
  };
  rangeStart: Date;
  rangeEnd: Date;
  todayRange: { startUtc: Date; endUtc: Date };
  sixtyAgo: Date;
  ctx: { businessId: string; timeframe: BusinessDashboardTimeframe };
};

const statsContextInflight = new Map<string, Promise<BusinessStatsContext>>();

/** Dedupe business row + range resolution when summary and analytics load in parallel. */
function loadBusinessStatsContext(
  businessId: string,
  timeframe: BusinessDashboardTimeframe,
): Promise<BusinessStatsContext> {
  const key = `${businessId}:${timeframe}`;
  const hit = statsContextInflight.get(key);
  if (hit) return hit;
  const promise = resolveBusinessStatsContext(businessId, timeframe).finally(() => {
    if (statsContextInflight.get(key) === promise) statsContextInflight.delete(key);
  });
  statsContextInflight.set(key, promise);
  return promise;
}

async function resolveBusinessStatsContext(
  businessId: string,
  timeframe: BusinessDashboardTimeframe,
): Promise<BusinessStatsContext> {
  const ctx = { businessId, timeframe };
  if (!businessId?.trim()) {
    throw new StatsFetchError("Business not found", { ...ctx, reason: "missing_business_id" });
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      verificationStatus: true,
      timezone: true,
    },
  });

  if (!business) {
    throw new StatsFetchError("Business not found", { ...ctx, reason: "business_row_missing" });
  }

  const tz = sanitizeIanaTimezone(business.timezone);
  const range = businessUtcRangeForTimeframe(timeframe === "all" ? "all" : timeframe, tz);
  const rangeStart = range?.startUtc ?? new Date(0);
  /** Prisma rejects JS max-date; for `all`, bound chart queries to now. */
  const rangeEnd = range?.endUtc ?? new Date();
  const now = new Date();
  const todayRange = businessUtcRangeForTimeframe("today", tz) ?? {
    startUtc: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
    endUtc: now,
  };
  const sixtyAgo = new Date(Date.now() - 60 * 60 * 1000);

  const tipWhere = {
    businessId,
    status: TipStatus.success,
    ...(range ? { createdAt: { gte: rangeStart, lte: rangeEnd } } : {}),
  };

  return {
    business,
    tz,
    timeframe,
    tipWhere,
    rangeStart,
    rangeEnd,
    todayRange,
    sixtyAgo,
    ctx,
  };
}

async function getBusinessStatsSummaryImpl(
  businessId: string,
  timeframe: BusinessDashboardTimeframe = "month",
) {
  const { business, tipWhere, todayRange, sixtyAgo, ctx } =
    await loadBusinessStatsContext(businessId, timeframe);
  logStatsPhase("summary_start", ctx);

  const [
    tipAgg,
    tipsLast60mAgg,
    tipsTodayAgg,
    rosterTotal,
    tippingReadyEmployees,
    employeesMissingQr,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: tipWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: { businessId, status: TipStatus.success, createdAt: { gte: sixtyAgo } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: {
        businessId,
        status: TipStatus.success,
        createdAt: { gte: todayRange.startUtc, lte: todayRange.endUtc },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.employee.count({ where: { businessId } }),
    prisma.employee.count({
      where: {
        businessId,
        isActive: true,
        activationStatus: "active" as EmployeeActivationStatus,
        user: { emailVerified: true },
      },
    }),
    prisma.employee.count({
      where: {
        businessId,
        OR: [{ slug: null }, { slug: "" }],
      },
    }),
  ]);

  const totalTips = Number(tipAgg._sum.amount ?? 0);
  const tipCount = tipAgg._count._all;

  logStatsPhase("summary_ok", { ...ctx, totalTips, tipCount, employeeCount: rosterTotal });

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    verificationStatus: business.verificationStatus,
    timeframe,
    totalTips,
    tipCount,
    employeeCount: rosterTotal,
    operationalPulse: {
      tipsLast60m: {
        amount: Number(tipsLast60mAgg._sum.amount ?? 0),
        count: tipsLast60mAgg._count._all,
      },
      tipsToday: {
        amount: Number(tipsTodayAgg._sum.amount ?? 0),
        count: tipsTodayAgg._count._all,
      },
      tippingReadyEmployees,
      rosterTotal,
      employeesMissingQr,
      goalsTracked: 0,
      goalsOnTrackOrBetter: 0,
    },
  };
}

async function getBusinessStatsAnalyticsImpl(
  businessId: string,
  timeframe: BusinessDashboardTimeframe = "month",
) {
  const { business, tz, tipWhere, rangeStart, rangeEnd, ctx } =
    await loadBusinessStatsContext(businessId, timeframe);
  logStatsPhase("analytics_start", ctx);

  const needsRowLevelChart = timeframe === "week" || timeframe === "month";
  const needsSqlMonthChart = timeframe === "year";
  /** All-time staff/roster views need employees + aggregates, not a 12-bucket calendar chart. */
  const skipMonthChart = timeframe === "all";

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

  const minimalEmployeeSelect = {
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

  const employeesPromise = (async () => {
    try {
      return await prisma.employee.findMany({
        where: { businessId },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        select: extendedEmployeeSelect,
      });
    } catch (extendedErr) {
      try {
        const rows = await prisma.employee.findMany({
          where: { businessId },
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
          select: legacyEmployeeSelect,
        });
        console.warn(
          "[getBusinessStats] Extended employee select failed (DB may need migration); using legacy columns.",
          extendedErr instanceof Error ? extendedErr.message : extendedErr,
        );
        return rows;
      } catch (legacyErr) {
        console.warn(
          "[getBusinessStats] Legacy employee select failed; using minimal columns.",
          legacyErr instanceof Error ? legacyErr.message : legacyErr,
        );
        return prisma.employee.findMany({
          where: { businessId },
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
          select: minimalEmployeeSelect,
        });
      }
    }
  })();

  const [tipsByEmployeeAgg, chartTipRows, monthChartTotals, employees] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["employeeId"],
      where: tipWhere,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { employeeId: "asc" },
    }),
    needsRowLevelChart
      ? prisma.transaction.findMany({
          where: tipWhere,
          select: { amount: true, createdAt: true },
        })
      : Promise.resolve([] as { amount: unknown; createdAt: Date }[]),
    needsSqlMonthChart
      ? monthlyTipTotalsForRange(businessId, rangeStart, rangeEnd, tz)
      : skipMonthChart
        ? Promise.resolve(new Array(12).fill(0))
        : Promise.resolve(null as number[] | null),
    employeesPromise,
  ]);

  let dailyTipDistribution: { day: string; amount: number }[];
  if ((needsSqlMonthChart || skipMonthChart) && monthChartTotals) {
    dailyTipDistribution = buildYearChartFromMonthTotals(monthChartTotals);
  } else {
    dailyTipDistribution = buildDailyTipDistribution(chartTipRows, timeframe, rangeStart, tz);
  }

  const tipsByEmp = new Map<string, { total: number; count: number }>();
  for (const row of tipsByEmployeeAgg) {
    tipsByEmp.set(row.employeeId, {
      total: Number(row._sum.amount ?? 0),
      count: row._count._all,
    });
  }

  const employeeStats = employees.map((emp) => {
    const agg = tipsByEmp.get(emp.id) ?? { total: 0, count: 0 };
    const account = emp.user ?? {
      email: "",
      emailVerified: false,
      passwordHash: null as string | null,
      oauthProvider: null as string | null,
    };
    const passwordIsSet =
      (account.passwordHash != null && account.passwordHash.length > 0) ||
      (account.oauthProvider != null && account.oauthProvider.trim().length > 0);
    return {
      id: emp.id,
      slug: emp.slug ?? null,
      name: emp.name ?? "Staff",
      jobTitle: emp.jobTitle ?? "",
      avatar: absolutizePublicMediaPath(emp.avatar),
      phone: emp.phone ?? null,
      isActive: emp.isActive ?? false,
      activationStatus: emp.activationStatus ?? "active",
      email: account.email,
      emailVerified: account.emailVerified === true,
      passwordIsSet,
      monthlyGoal: emp.monthlyGoal != null ? Number(emp.monthlyGoal) : null,
      locationId: "locationId" in emp ? (emp.locationId ?? null) : null,
      assignedTableIds:
        "tableAssignments" in emp && Array.isArray(emp.tableAssignments)
          ? emp.tableAssignments.map((ta: { table: { id: string } }) => ta.table.id)
          : [],
      tipsTotal: agg.total,
      tipCount: agg.count,
      rating: agg.count > 0 ? 4.8 : null,
    };
  });

  let employeeGoals: Awaited<ReturnType<typeof listEmployeeGoalsForBusiness>> = [];
  try {
    employeeGoals = await listEmployeeGoalsForBusiness(businessId, { maxGoals: 25 });
  } catch (goalsErr) {
    console.warn(
      "[getBusinessStats] employee goals omitted",
      goalsErr instanceof Error ? goalsErr.message : goalsErr,
    );
  }

  const goalsTracked = employeeGoals.length;
  const goalsOnTrackOrBetter = employeeGoals.filter(
    (g) => g.status === "on_track" || g.status === "achieved",
  ).length;

  logStatsPhase("analytics_ok", {
    ...ctx,
    employeeCount: employees.length,
    chartPoints: dailyTipDistribution.length,
  });

  return {
    id: business.id,
    timeframe,
    dailyTipDistribution,
    employees: employeeStats,
    employeeGoals,
    operationalPulse: {
      goalsTracked,
      goalsOnTrackOrBetter,
    },
  };
}

async function getBusinessStatsImpl(
  businessId: string,
  timeframe: BusinessDashboardTimeframe = "month",
) {
  const ctx = { businessId, timeframe };
  logStatsPhase("start", ctx);
  try {
    const [summary, analytics] = await Promise.all([
      getBusinessStatsSummaryImpl(businessId, timeframe),
      getBusinessStatsAnalyticsImpl(businessId, timeframe),
    ]);
    const pulseGoals = analytics.operationalPulse;
    const payload = {
      ...summary,
      timeframe,
      dailyTipDistribution: analytics.dailyTipDistribution,
      employees: analytics.employees,
      employeeGoals: analytics.employeeGoals,
      operationalPulse: {
        ...summary.operationalPulse,
        goalsTracked: pulseGoals.goalsTracked,
        goalsOnTrackOrBetter: pulseGoals.goalsOnTrackOrBetter,
      },
    };
    logStatsPhase("ok", {
      ...ctx,
      totalTips: payload.totalTips,
      tipCount: payload.tipCount,
      employeeCount: payload.employeeCount,
      chartPoints: payload.dailyTipDistribution?.length ?? 0,
    });
    return payload;
  } catch (err) {
    logStatsPhase("failed", ctx, err);
    if (err instanceof StatsFetchError) throw err;
    if (err instanceof Error && err.message === "Business not found") {
      throw new StatsFetchError(err.message, ctx, { cause: err });
    }
    throw new StatsFetchError("Unable to load stats", ctx, { cause: err });
  }
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

const MAX_LOCATION_LEN = 2000;

export async function updateManagerBusinessProfile(
  userId: string,
  data: {
    /** Preferred public / display name (same column as `legalBusinessName` legacy). */
    name?: string;
    legalBusinessName?: string;
    businessType?: string | null;
    /** Short venue location (separate from registered address). */
    location?: string | null;
    registeredAddress?: string | null;
    contactPhone?: string | null;
    website?: string | null;
  }
): Promise<{ id: string }> {
  const b = await getBusinessByUserId(userId);
  if (!b) {
    throw new Error("Business not found");
  }

  const nameSource = data.name !== undefined ? data.name : data.legalBusinessName;
  const nextName =
    nameSource !== undefined ? String(nameSource).trim() : undefined;
  if (nextName !== undefined && nextName.length === 0) {
    throw new Error("Business name is required");
  }
  const nextType = data.businessType !== undefined ? (data.businessType?.trim() || null) : undefined;
  const nextLocation =
    data.location !== undefined
      ? data.location == null
        ? null
        : (() => {
            const t = String(data.location).trim();
            if (t.length > MAX_LOCATION_LEN) {
              throw new Error(`Location must be at most ${MAX_LOCATION_LEN} characters`);
            }
            return t || null;
          })()
      : undefined;
  const nextAddress =
    data.registeredAddress !== undefined ? (data.registeredAddress?.trim() || null) : undefined;
  const nextPhone =
    data.contactPhone !== undefined ? (data.contactPhone?.trim() || null) : undefined;
  const nextWebsite =
    data.website !== undefined ? (data.website?.trim() || null) : undefined;

  await prisma.business.update({
    where: { id: b.id },
    data: {
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(nextType !== undefined ? { businessType: nextType } : {}),
      ...(nextLocation !== undefined ? { location: nextLocation } : {}),
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
      contactPhone: true,
      website: true,
      logoPath: true,
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
    logo: absolutizePublicMediaPath(business.logoPath ?? null),
    location: business.location ?? null,
    registeredAddress: business.registeredAddress ?? null,
    type: business.businessType ?? null,
    contactPhone: business.contactPhone ?? null,
    website: business.website ?? null,
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
  const base = normalizeBusinessSlugBase(b.name);
  const seed = `${base}-${randomBytes(2).toString("hex")}`;
  const slug = await ensureUniqueSlug(seed, async (s) => {
    const hit = await prisma.business.findFirst({ where: { slug: s, NOT: { id: b.id } } });
    return !!hit;
  });
  await prisma.business.update({ where: { id: b.id }, data: { slug } });
  emitBusinessDataChanged(b.id, "business_profile_updated");
  return { slug };
}
