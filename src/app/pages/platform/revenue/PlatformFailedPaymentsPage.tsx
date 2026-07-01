import { PlatformRevenueSubscriptionActivityPage } from "./PlatformRevenueSubscriptionActivityPage";

export function PlatformFailedPaymentsPage() {
  return (
    <PlatformRevenueSubscriptionActivityPage
      initialFilter="failed"
      titleKey="admin.revenuePages.failedPayments.title"
      subtitleKey="admin.revenuePages.failedPayments.subtitle"
    />
  );
}
