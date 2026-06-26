import { prisma } from "../../prisma.js";
import type { CommercialFeatureKey } from "./commercialFeatureKeys.js";
import { COMMERCIAL_FEATURE_KEYS, isCommercialFeatureKey } from "./commercialFeatureKeys.js";
import type { FeatureUtilizationRow } from "./businessFeatureUtilization.service.js";
import type { BusinessRetentionInsights } from "./businessRetentionInsights.service.js";
import { computeRetentionInsightsFromFacts } from "./businessRetentionInsights.service.js";

export type BusinessCommercialRow = {
  id: string;
  name: string;
  subscriptionTier: string | null;
  bannerImagePath: string | null;
  brandDisplayName: string | null;
  brandTagline: string | null;
  qrTemplate: string | null;
  welcomeMessage: string | null;
  thankYouMessage: string | null;
  user: {
    hasCompletedOnboarding: boolean;
    createdAt: Date;
  } | null;
};

export type ActivityFacts = {
  tips30d: number;
  tipsPrior30d: number;
  staffCount: number;
  locationCount: number;
  qr30d: number;
  qrPrior30d: number;
};

export type SubscriptionFacts = {
  status: string;
  cancelAtPeriodEnd: boolean;
  cancellationEffective: Date | null;
  canceledAt: Date | null;
};

export type PlatformCommercialBatch = {
  businesses: BusinessCommercialRow[];
  activityByBusiness: Map<string, ActivityFacts>;
  subscriptionByBusiness: Map<string, SubscriptionFacts>;
  utilizationByBusiness: Map<string, FeatureUtilizationRow[]>;
  tableCountByBusiness: Map<string, number>;
  goalCountByBusiness: Map<string, number>;
};

function countMapFromGroupBy(
  rows: Array<{ businessId: string; _count: { _all: number } }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.businessId, row._count._all);
  }
  return map;
}

function defaultActivity(): ActivityFacts {
  return {
    tips30d: 0,
    tipsPrior30d: 0,
    staffCount: 0,
    locationCount: 0,
    qr30d: 0,
    qrPrior30d: 0,
  };
}

function buildInferredUtilization(
  business: BusinessCommercialRow,
  facts: ActivityFacts,
  tableCount: number,
  goalCount: number,
): Map<CommercialFeatureKey, FeatureUtilizationRow> {
  const now = new Date().toISOString();
  const map = new Map<CommercialFeatureKey, FeatureUtilizationRow>();

  if (facts.locationCount > 1) {
    map.set("multi_location", {
      featureKey: "multi_location",
      hits30d: facts.locationCount,
      lastUsedAt: now,
      source: "inferred",
    });
  }

  if (tableCount > 0) {
    map.set("table_qr", {
      featureKey: "table_qr",
      hits30d: tableCount,
      lastUsedAt: now,
      source: "inferred",
    });
  }

  if (goalCount > 0) {
    map.set("employee_goals", {
      featureKey: "employee_goals",
      hits30d: goalCount,
      lastUsedAt: now,
      source: "inferred",
    });
  }

  if (facts.qr30d > 0) {
    map.set("qr_analytics", {
      featureKey: "qr_analytics",
      hits30d: facts.qr30d,
      lastUsedAt: now,
      source: "inferred",
    });
  }

  const hasBranding =
    Boolean(business.bannerImagePath) ||
    Boolean(business.brandDisplayName) ||
    Boolean(business.brandTagline) ||
    Boolean(business.welcomeMessage) ||
    Boolean(business.thankYouMessage) ||
    (business.qrTemplate && business.qrTemplate !== "velvet-lounge-noir");

  if (hasBranding) {
    map.set("branding", {
      featureKey: "branding",
      hits30d: 1,
      lastUsedAt: now,
      source: "inferred",
    });
    map.set("qr_studio", {
      featureKey: "qr_studio",
      hits30d: 1,
      lastUsedAt: now,
      source: "inferred",
    });
  }

  return map;
}

function mergeUtilization(
  tracked: Map<CommercialFeatureKey, FeatureUtilizationRow>,
  inferred: Map<CommercialFeatureKey, FeatureUtilizationRow>,
): FeatureUtilizationRow[] {
  const merged = new Map<CommercialFeatureKey, FeatureUtilizationRow>();
  for (const key of COMMERCIAL_FEATURE_KEYS) {
    const t = tracked.get(key);
    const i = inferred.get(key);
    if (!t && !i) continue;
    merged.set(key, {
      featureKey: key,
      hits30d: Math.max(t?.hits30d ?? 0, i?.hits30d ?? 0),
      lastUsedAt: t?.lastUsedAt ?? i?.lastUsedAt ?? null,
      source: t && i ? "tracked" : (t?.source ?? i?.source ?? "tracked"),
    });
  }
  return [...merged.values()].sort((a, b) => b.hits30d - a.hits30d);
}

/** Load all platform commercial facts in O(1) query rounds (not per business). */
export async function loadPlatformCommercialBatch(limit = 200): Promise<PlatformCommercialBatch> {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      bannerImagePath: true,
      brandDisplayName: true,
      brandTagline: true,
      qrTemplate: true,
      welcomeMessage: true,
      thankYouMessage: true,
      user: { select: { hasCompletedOnboarding: true, createdAt: true } },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  const businessIds = businesses.map((b) => b.id);
  if (businessIds.length === 0) {
    return {
      businesses,
      activityByBusiness: new Map(),
      subscriptionByBusiness: new Map(),
      utilizationByBusiness: new Map(),
      tableCountByBusiness: new Map(),
      goalCountByBusiness: new Map(),
    };
  }

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const utilSince = new Date();
  utilSince.setUTCDate(utilSince.getUTCDate() - 30);

  const [
    tips30Rows,
    tipsPriorRows,
    staffRows,
    locationRows,
    qr30Rows,
    qrPriorRows,
    subscriptions,
    utilRows,
    locationsWithTables,
    employeesWithGoals,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds }, status: "success", createdAt: { gte: d30 } },
      _count: { _all: true },
    }),
    prisma.transaction.groupBy({
      by: ["businessId"],
      where: {
        businessId: { in: businessIds },
        status: "success",
        createdAt: { gte: d60, lt: d30 },
      },
      _count: { _all: true },
    }),
    prisma.employee.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds }, isDeleted: false, isActive: true },
      _count: { _all: true },
    }),
    prisma.location.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _count: { _all: true },
    }),
    prisma.qrScanEvent.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds }, scannedAt: { gte: d30 } },
      _count: { _all: true },
    }),
    prisma.qrScanEvent.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds }, scannedAt: { gte: d60, lt: d30 } },
      _count: { _all: true },
    }),
    prisma.subscription.findMany({
      where: { businessId: { in: businessIds } },
      select: {
        businessId: true,
        status: true,
        cancelAtPeriodEnd: true,
        cancellationEffective: true,
        canceledAt: true,
      },
    }),
    prisma.featureUtilizationDaily.groupBy({
      by: ["businessId", "featureKey"],
      where: { businessId: { in: businessIds }, day: { gte: utilSince } },
      _sum: { hitCount: true },
      _max: { lastUsedAt: true },
    }),
    prisma.location.findMany({
      where: { businessId: { in: businessIds } },
      select: { businessId: true, _count: { select: { tables: true } } },
    }),
    prisma.employee.findMany({
      where: { businessId: { in: businessIds }, isDeleted: false },
      select: { businessId: true, _count: { select: { employeeGoals: true } } },
    }),
  ]);

  const tips30Map = countMapFromGroupBy(tips30Rows);
  const tipsPriorMap = countMapFromGroupBy(tipsPriorRows);
  const staffMap = countMapFromGroupBy(staffRows);
  const locationMap = countMapFromGroupBy(locationRows);
  const qr30Map = countMapFromGroupBy(qr30Rows);
  const qrPriorMap = countMapFromGroupBy(qrPriorRows);

  const activityByBusiness = new Map<string, ActivityFacts>();
  for (const id of businessIds) {
    activityByBusiness.set(id, {
      tips30d: tips30Map.get(id) ?? 0,
      tipsPrior30d: tipsPriorMap.get(id) ?? 0,
      staffCount: staffMap.get(id) ?? 0,
      locationCount: locationMap.get(id) ?? 0,
      qr30d: qr30Map.get(id) ?? 0,
      qrPrior30d: qrPriorMap.get(id) ?? 0,
    });
  }

  const subscriptionByBusiness = new Map<string, SubscriptionFacts>();
  for (const sub of subscriptions) {
    subscriptionByBusiness.set(sub.businessId, {
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      cancellationEffective: sub.cancellationEffective,
      canceledAt: sub.canceledAt,
    });
  }

  const tableCountByBusiness = new Map<string, number>();
  for (const loc of locationsWithTables) {
    tableCountByBusiness.set(
      loc.businessId,
      (tableCountByBusiness.get(loc.businessId) ?? 0) + loc._count.tables,
    );
  }

  const goalCountByBusiness = new Map<string, number>();
  for (const emp of employeesWithGoals) {
    goalCountByBusiness.set(
      emp.businessId,
      (goalCountByBusiness.get(emp.businessId) ?? 0) + emp._count.employeeGoals,
    );
  }

  const trackedByBusiness = new Map<string, Map<CommercialFeatureKey, FeatureUtilizationRow>>();
  for (const row of utilRows) {
    if (!isCommercialFeatureKey(row.featureKey)) continue;
    const bizMap = trackedByBusiness.get(row.businessId) ?? new Map();
    bizMap.set(row.featureKey, {
      featureKey: row.featureKey,
      hits30d: row._sum.hitCount ?? 0,
      lastUsedAt: row._max.lastUsedAt?.toISOString() ?? null,
      source: "tracked",
    });
    trackedByBusiness.set(row.businessId, bizMap);
  }

  const utilizationByBusiness = new Map<string, FeatureUtilizationRow[]>();
  for (const business of businesses) {
    const facts = activityByBusiness.get(business.id) ?? defaultActivity();
    const tracked = trackedByBusiness.get(business.id) ?? new Map();
    const inferred = buildInferredUtilization(
      business,
      facts,
      tableCountByBusiness.get(business.id) ?? 0,
      goalCountByBusiness.get(business.id) ?? 0,
    );
    utilizationByBusiness.set(business.id, mergeUtilization(tracked, inferred));
  }

  return {
    businesses,
    activityByBusiness,
    subscriptionByBusiness,
    utilizationByBusiness,
    tableCountByBusiness,
    goalCountByBusiness,
  };
}

export function retentionForBusiness(
  business: BusinessCommercialRow,
  activity: ActivityFacts,
  subscription: SubscriptionFacts | undefined,
): BusinessRetentionInsights {
  return computeRetentionInsightsFromFacts({
    hasCompletedOnboarding: business.user?.hasCompletedOnboarding ?? true,
    userCreatedAt: business.user?.createdAt ?? null,
    subscription: subscription ?? null,
    tips30d: activity.tips30d,
    tipsPrior30d: activity.tipsPrior30d,
    qr30d: activity.qr30d,
    qrPrior30d: activity.qrPrior30d,
    staffCount: activity.staffCount,
  });
}
