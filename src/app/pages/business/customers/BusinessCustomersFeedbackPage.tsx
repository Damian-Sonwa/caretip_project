import { FeatureGate } from "@/app/components/subscription/FeatureGate";
import { CustomerFeedbackPage } from "../CustomerFeedbackPage";

export function BusinessCustomersFeedbackPage() {
  return (
    <FeatureGate featureKey="customerFeedback" role="business">
      <CustomerFeedbackPage />
    </FeatureGate>
  );
}
