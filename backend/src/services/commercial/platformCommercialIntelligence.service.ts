import { prisma } from "../../prisma.js";
import { getBusinessFeatureUtilization } from "./businessFeatureUtilization.service.js";
import { getBusinessRetentionInsights } from "./businessRetentionInsights.service.js";
import { computeUpgradeOpportunities } from "./upgradeOpportunityEngine.service.js";
import { getSubscriptionIntelligence } from "./subscriptionIntelligence.service.js";

export type PlatformCommercialBusinessInsight = {
  businessId: string;
  name: string;
  tier: string;
  segment: "growth" | "at_risk" | "premium_opportunity" | "enterprise_candidate";
  reasonCode: string;
  evidence: Record<string, string | number>;
};

export type PlatformCommercialIntelligence = {
  subscription: Awaited<ReturnType<typeof getSubscriptionIntelligence>>;
  enterpriseReadiness: {
    score: number;
    maxScore: number;
    checks: Array<{ id: string; passed: boolean; label: string }>;
  };
  segments: {
    growthCandidates: PlatformCommercialBusinessInsight[];
    atRisk: PlatformCommercialBusinessInsight[];
    premiumOpportunities: PlatformCommercialBusinessInsight[];
    enterpriseCandidates: PlatformCommercialBusinessInsight[];
  };
};

async function businessActivityScore(businessId: string): Promise<{
  tips30d: number;
  tipsPrior30d: number;
  staffCount: number;
  locationCount: number;
}> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [tips30d, tipsPrior30d, staffCount, locationCount] = await Promise.all([
    prisma.transaction.count({ where: { businessId, status: "success", createdAt: { gte: d30 } } }),
    prisma.transaction.count({
      where: { businessId, status: "success", createdAt: { gte: d60, lt: d30 } },
    }),
    prisma.employee.count({ where: { businessId, isDeleted: false, isActive: true } }),
    prisma.location.count({ where: { businessId } }),
  ]);

  return { tips30d, tipsPrior30d, staffCount, locationCount };
}

/** Sprint 7E — admin commercial intelligence (existing dashboard surfaces). */
export async function getPlatformCommercialIntelligence(): Promise<PlatformCommercialIntelligence> {
  const subscription = await getSubscriptionIntelligence(30);

  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, subscriptionTier: true },
    take: 200,
    orderBy: { name: "asc" },
  });

  const growthCandidates: PlatformCommercialBusinessInsight[] = [];
  const atRisk: PlatformCommercialBusinessInsight[] = [];
  const premiumOpportunities: PlatformCommercialBusinessInsight[] = [];
  const enterpriseCandidates: PlatformCommercialBusinessInsight[] = [];

  for (const b of businesses) {
    const [activity, retention, utilization] = await Promise.all([
      businessActivityScore(b.id),
      getBusinessRetentionInsights(b.id),
      getBusinessFeatureUtilization(b.id),
    ]);

    const tipGrowth =
      activity.tipsPrior30d > 0
        ? Math.round(((activity.tips30d - activity.tipsPrior30d) / activity.tipsPrior30d) * 100)
        : activity.tips30d > 0
          ? 100
          : 0;

    if (tipGrowth >= 20 && activity.tips30d >= 5) {
      growthCandidates.push({
        businessId: b.id,
        name: b.name,
        tier: b.subscriptionTier,
        segment: "growth",
        reasonCode: "strong_tip_growth",
        evidence: { growth: tipGrowth, tips30d: activity.tips30d },
      });
    }

    if (retention.level === "medium" || retention.level === "high") {
      atRisk.push({
        businessId: b.id,
        name: b.name,
        tier: b.subscriptionTier,
        segment: "at_risk",
        reasonCode: retention.signals[0]?.reasonCode ?? "retention_risk",
        evidence: retention.signals[0]?.evidence ?? { level: retention.level },
      });
    }

    if (b.subscriptionTier === "basic") {
      const opps = computeUpgradeOpportunities({
        tier: b.subscriptionTier,
        staffCount: activity.staffCount,
        locationCount: activity.locationCount,
        tableCount: utilization.find((u) => u.featureKey === "table_qr")?.hits30d ?? 0,
        utilization,
      });
      if (opps.length > 0) {
        premiumOpportunities.push({
          businessId: b.id,
          name: b.name,
          tier: b.subscriptionTier,
          segment: "premium_opportunity",
          reasonCode: opps[0]!.reasonCode,
          evidence: opps[0]!.evidence,
        });
      }
    }

    if (
      activity.locationCount >= 3 &&
      activity.staffCount >= 15 &&
      b.subscriptionTier !== "enterprise"
    ) {
      const qrHits = utilization.find((u) => u.featureKey === "qr_analytics")?.hits30d ?? 0;
      if (qrHits >= 30) {
        enterpriseCandidates.push({
          businessId: b.id,
          name: b.name,
          tier: b.subscriptionTier,
          segment: "enterprise_candidate",
          reasonCode: "enterprise_scale",
          evidence: {
            locations: activity.locationCount,
            staff: activity.staffCount,
            qrScans30d: qrHits,
          },
        });
      }
    }
  }

  // Sprint 7H — enterprise readiness checklist (platform-level, not per-customer product)
  const checks = [
    { id: "billing_mirror", passed: subscription.activeSubscriptions > 0, label: "Subscription mirror active" },
    { id: "audit_trail", passed: true, label: "Subscription audit events" },
    { id: "entitlements", passed: true, label: "Server-side entitlement enforcement" },
    { id: "qr_analytics", passed: true, label: "QR analytics persistence" },
    { id: "api_access", passed: false, label: "Public API access (not shipped)" },
    { id: "multi_brand", passed: false, label: "Multi-brand support (not shipped)" },
    { id: "sla", passed: false, label: "SLA monitoring (not shipped)" },
    { id: "custom_reporting", passed: false, label: "Custom reporting exports (not shipped)" },
  ];
  const passed = checks.filter((c) => c.passed).length;

  return {
    subscription,
    enterpriseReadiness: {
      score: passed,
      maxScore: checks.length,
      checks,
    },
    segments: {
      growthCandidates: growthCandidates.slice(0, 8),
      atRisk: atRisk.slice(0, 8),
      premiumOpportunities: premiumOpportunities.slice(0, 8),
      enterpriseCandidates: enterpriseCandidates.slice(0, 8),
    },
  };
}

/** Manager-facing commercial bundle (Sprint 7B–D). */
export async function getManagerCommercialInsights(businessId: string) {
  const [business, utilization, retention, staffCount, locationCount, tableCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionTier: true },
    }),
    getBusinessFeatureUtilization(businessId),
    getBusinessRetentionInsights(businessId),
    prisma.employee.count({ where: { businessId, isDeleted: false, isActive: true } }),
    prisma.location.count({ where: { businessId } }),
    prisma.table.count({ where: { location: { businessId } } }),
  ]);

  if (!business) throw new Error("Business not found");

  const upgradeOpportunities = computeUpgradeOpportunities({
    tier: business.subscriptionTier,
    staffCount,
    locationCount,
    tableCount,
    utilization,
  });

  return {
    utilization,
    upgradeOpportunities,
    retention,
    tier: business.subscriptionTier,
  };
}
