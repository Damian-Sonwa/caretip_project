import { PlatformRevenueSubscriptionActivityPage } from "./PlatformRevenueSubscriptionActivityPage";

export function PlatformFailedSubscriptionsPage() {
  return (
    <PlatformRevenueSubscriptionActivityPage
      initialFilter="past_due"
      titleKey="admin.revenuePages.failedSubscriptions.title"
      subtitleKey="admin.revenuePages.failedSubscriptions.subtitle"
    />
  );
}
