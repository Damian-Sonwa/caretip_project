import { ProUpgradeCard } from "../../subscription/ProUpgradeCard";

/** Dashboard analytics locked state — delegates to shared Pro upgrade card. */
export function DashboardAnalyticsPreviewCard() {
  return <ProUpgradeCard className="business-dashboard-panel-card w-full" />;
}
