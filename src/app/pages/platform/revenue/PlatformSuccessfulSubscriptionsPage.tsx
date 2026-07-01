import { PlatformRevenueSubscriptionActivityPage } from "./PlatformRevenueSubscriptionActivityPage";

export function PlatformSuccessfulSubscriptionsPage() {
  return (
    <PlatformRevenueSubscriptionActivityPage
      initialFilter="successful"
      titleKey="admin.revenuePages.successfulSubscriptions.title"
      subtitleKey="admin.revenuePages.successfulSubscriptions.subtitle"
    />
  );
}
