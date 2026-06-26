import { logServerError } from "../../utils/httpErrors.js";
import { getCachedOrLoad } from "../../utils/shortLivedCache.js";
import type { FeatureUtilizationRow } from "./businessFeatureUtilization.service.js";
import { computeUpgradeOpportunities } from "./upgradeOpportunityEngine.service.js";
import { getSubscriptionIntelligence } from "./subscriptionIntelligence.service.js";
import { prisma } from "../../prisma.js";
import { resolveSubscriptionEntitlements } from "../subscriptionEntitlement.service.js";
import {
  loadPlatformCommercialBatch,
  retentionForBusiness,
  type ActivityFacts,
} from "./platformCommercialBatchData.js";



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



function segmentBusiness(

  business: { id: string; name: string; subscriptionTier: string | null },

  activity: ActivityFacts,

  retention: ReturnType<typeof retentionForBusiness>,

  utilization: FeatureUtilizationRow[],

  tableCount: number,

): {

  growthCandidates: PlatformCommercialBusinessInsight[];

  atRisk: PlatformCommercialBusinessInsight[];

  premiumOpportunities: PlatformCommercialBusinessInsight[];

  enterpriseCandidates: PlatformCommercialBusinessInsight[];

} {

  const growthCandidates: PlatformCommercialBusinessInsight[] = [];

  const atRisk: PlatformCommercialBusinessInsight[] = [];

  const premiumOpportunities: PlatformCommercialBusinessInsight[] = [];

  const enterpriseCandidates: PlatformCommercialBusinessInsight[] = [];



  const tipGrowth =

    activity.tipsPrior30d > 0

      ? Math.round(((activity.tips30d - activity.tipsPrior30d) / activity.tipsPrior30d) * 100)

      : activity.tips30d > 0

        ? 100

        : 0;



  if (tipGrowth >= 20 && activity.tips30d >= 5) {

    growthCandidates.push({

      businessId: business.id,

      name: business.name,

      tier: business.subscriptionTier ?? "none",

      segment: "growth",

      reasonCode: "strong_tip_growth",

      evidence: { growth: tipGrowth, tips30d: activity.tips30d },

    });

  }



  if (retention.level === "medium" || retention.level === "high") {

    atRisk.push({

      businessId: business.id,

      name: business.name,

      tier: business.subscriptionTier ?? "none",

      segment: "at_risk",

      reasonCode: retention.signals[0]?.reasonCode ?? "retention_risk",

      evidence: retention.signals[0]?.evidence ?? { level: retention.level },

    });

  }



  if (business.subscriptionTier === "basic") {

    const opps = computeUpgradeOpportunities({

      tier: business.subscriptionTier ?? "none",

      staffCount: activity.staffCount,

      locationCount: activity.locationCount,

      tableCount,

      utilization,

    });

    if (opps.length > 0) {

      premiumOpportunities.push({

        businessId: business.id,

        name: business.name,

        tier: business.subscriptionTier ?? "none",

        segment: "premium_opportunity",

        reasonCode: opps[0]!.reasonCode,

        evidence: opps[0]!.evidence,

      });

    }

  }



  if (

    activity.locationCount >= 3 &&

    activity.staffCount >= 15 &&

    business.subscriptionTier !== "enterprise"

  ) {

    const qrHits = utilization.find((u) => u.featureKey === "qr_analytics")?.hits30d ?? 0;

    if (qrHits >= 30) {

      enterpriseCandidates.push({

        businessId: business.id,

        name: business.name,

        tier: business.subscriptionTier ?? "none",

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



  return { growthCandidates, atRisk, premiumOpportunities, enterpriseCandidates };

}



/** Sprint 7E — admin commercial intelligence (batched queries, safe per-business isolation). */

async function getPlatformCommercialIntelligenceImpl(): Promise<PlatformCommercialIntelligence> {

  const [subscription, batch] = await Promise.all([

    getSubscriptionIntelligence(30),

    loadPlatformCommercialBatch(200),

  ]);



  const growthCandidates: PlatformCommercialBusinessInsight[] = [];

  const atRisk: PlatformCommercialBusinessInsight[] = [];

  const premiumOpportunities: PlatformCommercialBusinessInsight[] = [];

  const enterpriseCandidates: PlatformCommercialBusinessInsight[] = [];



  for (const business of batch.businesses) {

    try {

      const activity = batch.activityByBusiness.get(business.id) ?? {

        tips30d: 0,

        tipsPrior30d: 0,

        staffCount: 0,

        locationCount: 0,

        qr30d: 0,

        qrPrior30d: 0,

      };

      const retention = retentionForBusiness(

        business,

        activity,

        batch.subscriptionByBusiness.get(business.id),

      );

      const utilization = batch.utilizationByBusiness.get(business.id) ?? [];

      const tableCount = batch.tableCountByBusiness.get(business.id) ?? 0;



      const segments = segmentBusiness(business, activity, retention, utilization, tableCount);

      growthCandidates.push(...segments.growthCandidates);

      atRisk.push(...segments.atRisk);

      premiumOpportunities.push(...segments.premiumOpportunities);

      enterpriseCandidates.push(...segments.enterpriseCandidates);

    } catch (err) {

      logServerError("platformCommercialIntelligence.segmentBusiness", err, {

        businessId: business.id,

      });

    }

  }



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



const PLATFORM_COMMERCIAL_CACHE_TTL_MS = 60_000;



export async function getPlatformCommercialIntelligence(): Promise<PlatformCommercialIntelligence> {

  return getCachedOrLoad(

    "platform:commercial-intelligence",

    PLATFORM_COMMERCIAL_CACHE_TTL_MS,

    getPlatformCommercialIntelligenceImpl,

  );

}



/** Manager-facing commercial bundle (Sprint 7B–D). */

export async function getManagerCommercialInsights(businessId: string) {
  const { getBusinessFeatureUtilization } = await import("./businessFeatureUtilization.service.js");
  const { getBusinessRetentionInsights } = await import("./businessRetentionInsights.service.js");

  const [entitlements, utilization, retention, staffCount, locationCount, tableCount] = await Promise.all([
    resolveSubscriptionEntitlements(businessId),
    getBusinessFeatureUtilization(businessId),
    getBusinessRetentionInsights(businessId),
    prisma.employee.count({ where: { businessId, isDeleted: false, isActive: true } }),
    prisma.location.count({ where: { businessId } }),
    prisma.table.count({ where: { location: { businessId } } }),
  ]);

  const tier = entitlements.subscriptionTier ?? "basic";

  const upgradeOpportunities = computeUpgradeOpportunities({
    tier,
    staffCount,
    locationCount,
    tableCount,
    utilization,
  });

  return {
    utilization,
    upgradeOpportunities,
    retention,
    tier: entitlements.subscriptionTier,
  };
}


