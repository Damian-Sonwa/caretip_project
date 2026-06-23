import type { BusinessSubscriptionTier } from "@prisma/client";
import type { FeatureUtilizationRow } from "./businessFeatureUtilization.service.js";
import { FEATURE_CAPABILITY_MAP } from "./commercialFeatureKeys.js";

export type UpgradeOpportunity = {
  id: string;
  suggestedTier: "premium" | "enterprise";
  reasonCode: string;
  evidence: Record<string, string | number>;
  sourceKpi: string;
  calculationPath: string;
};

type BusinessFacts = {
  tier: BusinessSubscriptionTier;
  staffCount: number;
  locationCount: number;
  tableCount: number;
  utilization: FeatureUtilizationRow[];
};

function hits(utilization: FeatureUtilizationRow[], key: string): number {
  return utilization.find((u) => u.featureKey === key)?.hits30d ?? 0;
}

/**
 * Sprint 7C — explainable upgrade opportunities (no dark patterns).
 * Only suggests when usage patterns exceed Basic tier expectations.
 */
export function computeUpgradeOpportunities(facts: BusinessFacts): UpgradeOpportunity[] {
  const { tier, staffCount, locationCount, tableCount, utilization } = facts;
  if (tier !== "basic") return [];

  const out: UpgradeOpportunity[] = [];

  const analyticsHits = hits(utilization, "analytics_page") + hits(utilization, "performance_page");
  if (analyticsHits >= 3) {
    out.push({
      id: "analytics-heavy",
      suggestedTier: "premium",
      reasonCode: "analytics_usage",
      evidence: { visits: analyticsHits },
      sourceKpi: "analytics_page + performance_page",
      calculationPath: "tracked page visits >= 3 in 30d on basic tier",
    });
  }

  if (hits(utilization, "qr_analytics") >= 10 || hits(utilization, "qr_studio") >= 3) {
    out.push({
      id: "qr-heavy",
      suggestedTier: "premium",
      reasonCode: "qr_intelligence",
      evidence: {
        qrAnalytics: hits(utilization, "qr_analytics"),
        qrStudio: hits(utilization, "qr_studio"),
      },
      sourceKpi: "qr_analytics | qr_studio",
      calculationPath: "QR analytics scans >= 10 or QR studio visits >= 3 in 30d",
    });
  }

  if (staffCount >= 5) {
    out.push({
      id: "team-scale",
      suggestedTier: "premium",
      reasonCode: "team_scale",
      evidence: { staffCount },
      sourceKpi: "staffCount",
      calculationPath: "active employees >= 5 on basic tier",
    });
  }

  if (locationCount > 1) {
    out.push({
      id: "multi-location",
      suggestedTier: "premium",
      reasonCode: "multi_location",
      evidence: { locationCount },
      sourceKpi: "locationCount",
      calculationPath: "locations > 1 exceeds basic cap (1)",
    });
  }

  if (tableCount > 0) {
    out.push({
      id: "table-qr",
      suggestedTier: "premium",
      reasonCode: "table_qr",
      evidence: { tableCount },
      sourceKpi: "tableCount",
      calculationPath: "tables configured — table QR requires premium",
    });
  }

  if (hits(utilization, "csv_export") >= 1) {
    out.push({
      id: "csv-export",
      suggestedTier: "premium",
      reasonCode: "csv_export",
      evidence: { attempts: hits(utilization, "csv_export") },
      sourceKpi: "csv_export",
      calculationPath: "CSV export attempted on basic tier",
    });
  }

  if (hits(utilization, "employee_goals") >= 1) {
    out.push({
      id: "goals-active",
      suggestedTier: "premium",
      reasonCode: "employee_goals",
      evidence: { goals: hits(utilization, "employee_goals") },
      sourceKpi: "employee_goals",
      calculationPath: "employee goals in use on basic tier",
    });
  }

  if (hits(utilization, "branding") >= 1) {
    out.push({
      id: "branding-custom",
      suggestedTier: "premium",
      reasonCode: "branding",
      evidence: { signals: hits(utilization, "branding") },
      sourceKpi: "branding",
      calculationPath: "custom branding fields populated on basic tier",
    });
  }

  // Enterprise candidates from basic/premium with heavy scale
  if (
    tier === "basic" &&
    locationCount >= 3 &&
    staffCount >= 15 &&
    hits(utilization, "qr_analytics") >= 50
  ) {
    out.push({
      id: "enterprise-scale",
      suggestedTier: "enterprise",
      reasonCode: "enterprise_scale",
      evidence: { locationCount, staffCount, qrScans: hits(utilization, "qr_analytics") },
      sourceKpi: "locationCount + staffCount + qr_analytics",
      calculationPath: "locations >= 3 AND staff >= 15 AND qr scans >= 50 in 30d",
    });
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return out.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  }).slice(0, 5);
}

/** Map opportunity to primary capability for UI copy. */
export function primaryCapabilityForOpportunity(id: string): string | null {
  const map: Record<string, string> = {
    "analytics-heavy": "advancedAnalytics",
    "qr-heavy": "advancedAnalytics",
    "csv-export": "csvExport",
    "multi-location": "multiLocation",
    "table-qr": "tableQr",
    "goals-active": "employeeGoals",
    "branding-custom": "brandingCustomization",
  };
  return map[id] ?? null;
}
