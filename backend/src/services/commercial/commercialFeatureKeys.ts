/** Sprint 7B — trackable commercial feature keys (maps to Premium capabilities where applicable). */

export const COMMERCIAL_FEATURE_KEYS = [
  "qr_studio",
  "qr_analytics",
  "analytics_page",
  "performance_page",
  "csv_export",
  "branding",
  "employee_goals",
  "multi_location",
  "table_qr",
] as const;

export type CommercialFeatureKey = (typeof COMMERCIAL_FEATURE_KEYS)[number];

export function isCommercialFeatureKey(value: string): value is CommercialFeatureKey {
  return (COMMERCIAL_FEATURE_KEYS as readonly string[]).includes(value);
}

/** Maps utilization key → subscription capability for upgrade reasoning. */
export const FEATURE_CAPABILITY_MAP: Partial<
  Record<CommercialFeatureKey, import("../../config/subscriptionCapabilities.js").SubscriptionCapability>
> = {
  qr_analytics: "advancedAnalytics",
  analytics_page: "advancedAnalytics",
  performance_page: "advancedAnalytics",
  csv_export: "csvExport",
  branding: "brandingCustomization",
  employee_goals: "employeeGoals",
  multi_location: "multiLocation",
  table_qr: "tableQr",
  qr_studio: "brandingCustomization",
};
