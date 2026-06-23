/**
 * Sprint 6B — single orchestrator for business intelligence.
 * All pages consume output via buildBusinessAnalyticsDTO → useBusinessAnalytics.
 * No page-specific intelligence logic.
 */
import type { BusinessQrAnalytics } from "./api";
import {
  aggregateBusinessIntelligenceLegacyCompute,
  type BusinessIntelligenceInput,
  generateExecutiveInsights,
  generateExecutiveRecommendations,
  generateExecutiveRisks,
  generateExecutiveSummary,
  generateOpportunities,
} from "./businessIntelligence";

export type { BusinessIntelligenceInput };
export type BusinessIntelligenceAggregate = ReturnType<typeof runBusinessIntelligenceEngine>;

/** Sprint 6 — authoritative intelligence entry point. */
export function runBusinessIntelligenceEngine(
  input: BusinessIntelligenceInput,
) {
  const base = aggregateBusinessIntelligenceLegacyCompute(input);
  const risks = generateExecutiveRisks(input);
  const opportunities = generateOpportunities(input);
  const recommendations = generateExecutiveRecommendations(input, risks, opportunities);
  const executiveSummary = generateExecutiveSummary(input, {
    revenue: base.revenue,
    snapshot: base.snapshot,
    risks,
    opportunities,
    qrAnalytics: input.qrAnalytics ?? null,
  });
  const executiveInsights = generateExecutiveInsights(input);

  return {
    ...base,
    executiveInsights,
    risks,
    opportunities,
    recommendations,
    executiveSummary,
  };
}

/** @deprecated Use runBusinessIntelligenceEngine — retained for import stability. */
export function aggregateBusinessIntelligence(
  input: BusinessIntelligenceInput,
): BusinessIntelligenceAggregate {
  return runBusinessIntelligenceEngine(input);
}

export type QrIntelligenceContext = {
  qrAnalytics: BusinessQrAnalytics | null;
};
