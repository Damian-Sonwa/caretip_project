import { LockedFeatureCard } from "../../subscription/LockedFeatureCard";

/** Dashboard locked analytics teaser — same LockedFeatureCard as full premium pages. */
export function DashboardAnalyticsPreviewCard() {
  return (
    <LockedFeatureCard
      featureKey="advancedAnalytics"
      tier={null}
      subscriptionStatus="none"
      className="business-dashboard-panel-card w-full"
    />
  );
}
